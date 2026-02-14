# radiosphere_v2_2_2.ps1
$RepoUrl = "https://github.com/Mrbender7/radiosphere"
$ProjectFolder = "radiosphere"
$UTF8NoBOM = New-Object System.Text.UTF8Encoding($False)

Write-Host ">>> Lancement du Master Fix v2.2.2 - Android Only + Silent Notification Channel" -ForegroundColor Cyan

if (Test-Path $ProjectFolder) { Remove-Item -Recurse -Force $ProjectFolder }
git clone $RepoUrl
cd $ProjectFolder

# 1. Config Capacitor
Write-Host ">>> Configuration Capacitor..." -ForegroundColor Yellow
$ConfigJSON = @"
{
  "appId": "com.radiosphere.app",
  "appName": "Radio Sphere",
  "webDir": "dist",
  "server": { "androidScheme": "https", "allowNavigation": ["*"] }
}
"@
$ConfigJSON | Out-File -FilePath "capacitor.config.json" -Encoding utf8

# 2. Installation et Build
Write-Host ">>> Installation des dependances et build..." -ForegroundColor Yellow
npm install --legacy-peer-deps
npm install @capacitor/cli @capawesome-team/capacitor-android-foreground-service
npm run build
npm install @capacitor/android
npx cap add android

# 3. Generation des icones de notification (ic_notification.png)
#    IMPORTANT : Ces icones DOIVENT etre monochromes (blanc sur transparent) pour Android.
#    Le script copie ic_launcher comme fallback temporaire.
#    Pour un rendu correct dans la barre de notif :
#      -> Utiliser Android Studio > File > New > Image Asset > Icon Type: "Notification Icons"
#      -> Ou remplacer manuellement par des PNG blancs sur transparent aux tailles ci-dessous.
Write-Host ">>> Generation des icones de notification (fallback)..." -ForegroundColor Yellow

$sizes = @{ "mdpi"=24; "hdpi"=36; "xhdpi"=48; "xxhdpi"=72; "xxxhdpi"=96 }
foreach ($density in $sizes.Keys) {
    $dir = "android/app/src/main/res/drawable-$density"
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }
    $src = "android/app/src/main/res/mipmap-$density/ic_launcher_foreground.png"
    if (!(Test-Path $src)) {
        $src = "android/app/src/main/res/mipmap-$density/ic_launcher.png"
    }
    if (Test-Path $src) {
        Copy-Item $src "$dir/ic_notification.png" -Force
        Write-Host "    Copie $density -> ic_notification.png" -ForegroundColor DarkGray
    } else {
        Write-Host "    ATTENTION: Pas de source pour $density" -ForegroundColor Red
    }
}

# Fallback dans drawable/ (sans densite)
$DrawablePath = "android/app/src/main/res/drawable"
if (!(Test-Path $DrawablePath)) { New-Item -ItemType Directory -Path $DrawablePath -Force }
$FallbackSrc = "android/app/src/main/res/mipmap-mdpi/ic_launcher.png"
if (Test-Path $FallbackSrc) {
    Copy-Item $FallbackSrc "$DrawablePath/ic_notification.png" -Force
    Write-Host "    Fallback drawable/ic_notification.png OK" -ForegroundColor DarkGray
}

# 4. FIX MANIFEST (Permissions + Service + Receiver)
$ManifestPath = "android/app/src/main/AndroidManifest.xml"
if (Test-Path $ManifestPath) {
    Write-Host ">>> Manifest: Injection complete (Permissions & Services)..." -ForegroundColor Yellow
    $ManifestContent = Get-Content $ManifestPath -Raw
    
    # A. Permissions
    $Perms = @"
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
"@
    $ManifestContent = $ManifestContent -replace '(<manifest[^>]*>)', "`$1`n$Perms"
    
    # B. Cleartext
    if ($ManifestContent -notmatch 'usesCleartextTraffic') {
        $ManifestContent = $ManifestContent -replace '<application', '<application android:usesCleartextTraffic="true"'
    }
    
    # C. Service + Receiver
    $ServiceDecl = @"
    <receiver android:name="io.capawesome.capacitorjs.plugins.foregroundservice.NotificationActionBroadcastReceiver" />
    <service android:name="io.capawesome.capacitorjs.plugins.foregroundservice.AndroidForegroundService" android:foregroundServiceType="mediaPlayback" />
"@
    $ManifestContent = $ManifestContent -replace '(<application[^>]*>)', "`$1`n$ServiceDecl"
    
    [System.IO.File]::WriteAllText((Join-Path (Get-Location).Path $ManifestPath), $ManifestContent, $UTF8NoBOM)
}

# 5. FIX DUPLICATE KOTLIN CLASSES
$GradleAppPath = "android/app/build.gradle"
if (Test-Path $GradleAppPath) {
    Write-Host ">>> Nettoyage des conflits Kotlin..." -ForegroundColor Yellow
    $GradleContent = Get-Content $GradleAppPath -Raw
    $KotlinFix = @"
dependencies {
    implementation(platform("org.jetbrains.kotlin:kotlin-bom:1.8.22"))
    constraints {
        implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.22")
        implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22")
    }
"@
    $GradleContent = $GradleContent -replace 'dependencies \{', $KotlinFix
    [System.IO.File]::WriteAllText((Join-Path (Get-Location).Path $GradleAppPath), $GradleContent, $UTF8NoBOM)
}

# 6. Patch MainActivity.java (Mixed Content + Autoplay + Silent Notification Channel)
$MainAct = Get-ChildItem -Path "android/app/src/main/java" -Filter "MainActivity.java" -Recurse | Select-Object -First 1
if ($MainAct) {
    Write-Host ">>> Patch Java (WebView + Notification Channel silencieux)..." -ForegroundColor Yellow
    
    $JavaPatches = @"
  @Override
  public void onCreate(android.os.Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Creer un canal de notification silencieux pour le foreground service
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
        android.app.NotificationChannel channel = new android.app.NotificationChannel(
            "foreground_service",
            "Radio Playback",
            android.app.NotificationManager.IMPORTANCE_LOW
        );
        channel.setSound(null, null);
        channel.enableVibration(false);
        channel.setShowBadge(false);
        android.app.NotificationManager nm = getSystemService(android.app.NotificationManager.class);
        if (nm != null) nm.createNotificationChannel(channel);
    }
  }

  @Override
  public void onResume() {
    super.onResume();
    if (getBridge() != null && getBridge().getWebView() != null) {
        android.webkit.WebSettings s = getBridge().getWebView().getSettings();
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
    }
  }
"@
    $Java = Get-Content $MainAct.FullName -Raw
    # Supprimer les anciens patches s'ils existent
    $Java = $Java -replace '(?s)\s*@Override\s*public void onResume\(\).*?}\s*}', ''
    # Injecter les nouveaux patches
    $NewJava = $Java -replace 'public class MainActivity extends BridgeActivity \{', "public class MainActivity extends BridgeActivity {`n$JavaPatches"
    [System.IO.File]::WriteAllText($MainAct.FullName, $NewJava, $UTF8NoBOM)
    Write-Host "    Canal 'foreground_service' IMPORTANCE_LOW + sound=null injecte" -ForegroundColor DarkGray
}

# 7. Sync final
npx cap sync
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host ">>> Script v2.2.2 Termine !" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "ETAPE SUIVANTE - Icone de notification :" -ForegroundColor Yellow
Write-Host "  1. Ouvrir android/ dans Android Studio" -ForegroundColor White
Write-Host "  2. Clic droit sur 'res' > New > Image Asset" -ForegroundColor White
Write-Host "  3. Icon Type: 'Notification Icons'" -ForegroundColor White
Write-Host "  4. Charger ton logo, nommer 'ic_notification'" -ForegroundColor White
Write-Host "  5. Finish -> Build APK" -ForegroundColor White
Write-Host ""
Write-Host ">>> npx cap open android" -ForegroundColor Cyan

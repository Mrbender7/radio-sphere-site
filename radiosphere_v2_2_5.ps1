# radiosphere_v2_2_5.ps1
# Android Auto Integration — Full automated setup
$RepoUrl = "https://github.com/Mrbender7/radiosphere"
$ProjectFolder = "radiosphere"
$UTF8NoBOM = New-Object System.Text.UTF8Encoding($False)
$PackagePath = "app/lovable/radiosphere"

Write-Host ">>> Lancement du Master Fix v2.2.5 - Android Auto Integration" -ForegroundColor Cyan

if (Test-Path $ProjectFolder) { Remove-Item -Recurse -Force $ProjectFolder }
git clone $RepoUrl
cd $ProjectFolder

# ═══════════════════════════════════════════════════════════════════
# 1. Config Capacitor
# ═══════════════════════════════════════════════════════════════════
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

# ═══════════════════════════════════════════════════════════════════
# 2. Installation et Build
# ═══════════════════════════════════════════════════════════════════
Write-Host ">>> Installation des dependances et build..." -ForegroundColor Yellow
npm install --legacy-peer-deps
npm install @capacitor/cli @capawesome-team/capacitor-android-foreground-service @capacitor/app
npm run build
npm install @capacitor/android
npx cap add android

# ═══════════════════════════════════════════════════════════════════
# 3. Generation des icones de notification
# ═══════════════════════════════════════════════════════════════════
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

$DrawablePath = "android/app/src/main/res/drawable"
if (!(Test-Path $DrawablePath)) { New-Item -ItemType Directory -Path $DrawablePath -Force }
$FallbackSrc = "android/app/src/main/res/mipmap-mdpi/ic_launcher.png"
if (Test-Path $FallbackSrc) {
    Copy-Item $FallbackSrc "$DrawablePath/ic_notification.png" -Force
    Write-Host "    Fallback drawable/ic_notification.png OK" -ForegroundColor DarkGray
}

# ═══════════════════════════════════════════════════════════════════
# 4. MANIFEST — Permissions + Services + Android Auto
# ═══════════════════════════════════════════════════════════════════
$ManifestPath = "android/app/src/main/AndroidManifest.xml"
if (Test-Path $ManifestPath) {
    Write-Host ">>> Manifest: Injection complete (Permissions, Services, Android Auto)..." -ForegroundColor Yellow
    $ManifestContent = Get-Content $ManifestPath -Raw
    
    # Permissions
    $Perms = @"
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
"@
    $ManifestContent = $ManifestContent -replace '(<manifest[^>]*>)', "`$1`n$Perms"
    
    if ($ManifestContent -notmatch 'usesCleartextTraffic') {
        $ManifestContent = $ManifestContent -replace '<application', '<application android:usesCleartextTraffic="true"'
    }
    
    # Foreground service + Android Auto MediaBrowserService
    $ServiceDecl = @"
    <receiver android:name="io.capawesome.capacitorjs.plugins.foregroundservice.NotificationActionBroadcastReceiver" />
    <service android:name="io.capawesome.capacitorjs.plugins.foregroundservice.AndroidForegroundService" android:foregroundServiceType="mediaPlayback" />

    <!-- Android Auto -->
    <meta-data
        android:name="com.google.android.gms.car.application"
        android:resource="@xml/automotive_app_desc" />
    <service
        android:name=".RadioBrowserService"
        android:exported="true">
        <intent-filter>
            <action android:name="android.media.browse.MediaBrowserService" />
        </intent-filter>
    </service>
"@
    $ManifestContent = $ManifestContent -replace '(<application[^>]*>)', "`$1`n$ServiceDecl"
    
    [System.IO.File]::WriteAllText((Join-Path (Get-Location).Path $ManifestPath), $ManifestContent, $UTF8NoBOM)
}

# ═══════════════════════════════════════════════════════════════════
# 5. Gradle — Kotlin fix + ExoPlayer + Media Compat
# ═══════════════════════════════════════════════════════════════════
$GradleAppPath = "android/app/build.gradle"
if (Test-Path $GradleAppPath) {
    Write-Host ">>> Gradle: Kotlin fix + ExoPlayer + Media Compat..." -ForegroundColor Yellow
    $GradleContent = Get-Content $GradleAppPath -Raw
    $DepsBlock = @"
dependencies {
    implementation(platform("org.jetbrains.kotlin:kotlin-bom:1.8.22"))
    constraints {
        implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.22")
        implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22")
    }
    // ExoPlayer for Android Auto native audio playback
    implementation 'com.google.android.exoplayer:exoplayer-core:2.19.1'
    implementation 'com.google.android.exoplayer:exoplayer-ui:2.19.1'
    // Media Compat for MediaBrowserService & MediaSession
    implementation 'androidx.media:media:1.7.0'
"@
    $GradleContent = $GradleContent -replace 'dependencies \{', $DepsBlock
    [System.IO.File]::WriteAllText((Join-Path (Get-Location).Path $GradleAppPath), $GradleContent, $UTF8NoBOM)
}

# ═══════════════════════════════════════════════════════════════════
# 6. Copy Android Auto native files
# ═══════════════════════════════════════════════════════════════════
Write-Host ">>> Copie des fichiers natifs Android Auto..." -ForegroundColor Yellow

# Determine the Java/Kotlin source directory
$JavaSrcBase = "android/app/src/main/java"
# Find the actual package directory (could be different from expected)
$PackageDir = "$JavaSrcBase/com/radiosphere/app"
if (!(Test-Path $PackageDir)) {
    # Try to find MainActivity to determine the package path
    $MainActFile = Get-ChildItem -Path $JavaSrcBase -Filter "MainActivity.*" -Recurse | Select-Object -First 1
    if ($MainActFile) {
        $PackageDir = $MainActFile.DirectoryName
        Write-Host "    Package directory found: $PackageDir" -ForegroundColor DarkGray
    } else {
        $PackageDir = "$JavaSrcBase/com/radiosphere/app"
        New-Item -ItemType Directory -Path $PackageDir -Force | Out-Null
    }
}

# Read the package name from existing MainActivity
$ActualPackage = "com.radiosphere.app"
$MainActSearch = Get-ChildItem -Path $JavaSrcBase -Filter "MainActivity.*" -Recurse | Select-Object -First 1
if ($MainActSearch) {
    $MainContent = Get-Content $MainActSearch.FullName -Raw
    if ($MainContent -match 'package\s+([\w.]+)') {
        $ActualPackage = $Matches[1]
        Write-Host "    Package detecte: $ActualPackage" -ForegroundColor DarkGray
    }
}

# --- RadioBrowserService.kt ---
Write-Host "    Copie RadioBrowserService.kt..." -ForegroundColor DarkGray
$BrowserServiceSrc = Get-Content "android-auto/RadioBrowserService.kt" -Raw
# Replace package name to match actual project
$BrowserServiceSrc = $BrowserServiceSrc -replace 'package app\.lovable\.radiosphere', "package $ActualPackage"
[System.IO.File]::WriteAllText((Join-Path $PackageDir "RadioBrowserService.kt"), $BrowserServiceSrc, $UTF8NoBOM)

# --- RadioAutoPlugin.kt ---
Write-Host "    Copie RadioAutoPlugin.kt..." -ForegroundColor DarkGray
$AutoPluginSrc = Get-Content "android-auto/RadioAutoPlugin.kt" -Raw
$AutoPluginSrc = $AutoPluginSrc -replace 'package app\.lovable\.radiosphere', "package $ActualPackage"
[System.IO.File]::WriteAllText((Join-Path $PackageDir "RadioAutoPlugin.kt"), $AutoPluginSrc, $UTF8NoBOM)

# --- automotive_app_desc.xml ---
Write-Host "    Copie automotive_app_desc.xml..." -ForegroundColor DarkGray
$XmlDir = "android/app/src/main/res/xml"
if (!(Test-Path $XmlDir)) { New-Item -ItemType Directory -Path $XmlDir -Force | Out-Null }
Copy-Item "android-auto/res/xml/automotive_app_desc.xml" "$XmlDir/automotive_app_desc.xml" -Force

Write-Host "    Fichiers Android Auto copies avec succes!" -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════════
# 7. Patch MainActivity — WebView + NotificationChannel + RadioAutoPlugin
# ═══════════════════════════════════════════════════════════════════
$MainAct = Get-ChildItem -Path "android/app/src/main/java" -Filter "MainActivity.*" -Recurse | Select-Object -First 1
if ($MainAct) {
    $IsKotlin = $MainAct.Extension -eq ".kt"
    
    if ($IsKotlin) {
        Write-Host ">>> Patch Kotlin MainActivity (WebView + NotifChannel + RadioAutoPlugin)..." -ForegroundColor Yellow
        $Kotlin = Get-Content $MainAct.FullName -Raw
        
        # Add import for RadioAutoPlugin if not present
        if ($Kotlin -notmatch 'RadioAutoPlugin') {
            $Kotlin = $Kotlin -replace '(import .+BridgeActivity)', "`$1`nimport $ActualPackage.RadioAutoPlugin"
        }
        
        $KotlinPatch = @"
    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        registerPlugin(RadioAutoPlugin::class.java)
        super.onCreate(savedInstanceState)
        // Create notification channel without badge
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            val nm = getSystemService(android.content.Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
            val channel = android.app.NotificationChannel(
                "radio_playback_v3", "Radio Playback", android.app.NotificationManager.IMPORTANCE_LOW)
            channel.setShowBadge(false)
            channel.description = "Notification silencieuse pour la lecture radio"
            channel.enableVibration(false)
            nm.createNotificationChannel(channel)
        }
        // WebView settings
        bridge?.webView?.settings?.apply {
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }
    }
"@
        # Remove existing onCreate if present
        $Kotlin = $Kotlin -replace '(?s)\s*override fun onCreate\(savedInstanceState[^}]*\{[^}]*(\{[^}]*\}[^}]*)*\}', ''
        # Insert patch
        $Kotlin = $Kotlin -replace '(class MainActivity\s*:\s*BridgeActivity\(\)\s*\{)', "`$1`n$KotlinPatch"
        [System.IO.File]::WriteAllText($MainAct.FullName, $Kotlin, $UTF8NoBOM)
        
    } else {
        Write-Host ">>> Patch Java MainActivity (WebView + NotifChannel + RadioAutoPlugin)..." -ForegroundColor Yellow
        $Java = Get-Content $MainAct.FullName -Raw

        # Add import for RadioAutoPlugin
        if ($Java -notmatch 'RadioAutoPlugin') {
            $Java = $Java -replace '(import .+BridgeActivity;)', "`$1`nimport $ActualPackage.RadioAutoPlugin;"
        }

        $OnCreatePatch = @"
  @Override
  public void onCreate(android.os.Bundle savedInstanceState) {
    registerPlugin(RadioAutoPlugin.class);
    super.onCreate(savedInstanceState);
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
        android.app.NotificationManager nm = (android.app.NotificationManager) getSystemService(android.content.Context.NOTIFICATION_SERVICE);
        android.app.NotificationChannel channel = new android.app.NotificationChannel(
            "radio_playback_v3", "Radio Playback", android.app.NotificationManager.IMPORTANCE_LOW);
        channel.setShowBadge(false);
        channel.setDescription("Notification silencieuse pour la lecture radio");
        channel.enableVibration(false);
        nm.createNotificationChannel(channel);
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
        $Java = $Java -replace '(?s)\s*@Override\s*public void onCreate\(android\.os\.Bundle[^}]*}\s*}\s*}', ''
        $Java = $Java -replace '(?s)\s*@Override\s*public void onResume\(\).*?}\s*}', ''
        if ($Java -notmatch "RadioAutoPlugin") {
            $Java = $Java -replace 'public class MainActivity extends BridgeActivity \{', "public class MainActivity extends BridgeActivity {`n$OnCreatePatch"
        }
        [System.IO.File]::WriteAllText($MainAct.FullName, $Java, $UTF8NoBOM)
    }
}

# ═══════════════════════════════════════════════════════════════════
# 8. Sync final
# ═══════════════════════════════════════════════════════════════════
npx cap sync

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host ">>> Script v2.2.5 Termine ! Android Auto Ready" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "CHANGEMENTS v2.2.5 :" -ForegroundColor Yellow
Write-Host "  - Android Auto MediaBrowserService integre" -ForegroundColor White
Write-Host "  - ExoPlayer + Media Compat ajoutes au Gradle" -ForegroundColor White
Write-Host "  - RadioAutoPlugin Capacitor enregistre dans MainActivity" -ForegroundColor White
Write-Host "  - Browse tree: Favoris, Recents, 24 Genres" -ForegroundColor White
Write-Host "  - Recherche vocale (API radio-browser.info native)" -ForegroundColor White
Write-Host "  - Artwork plein ecran + Next/Previous dans favoris" -ForegroundColor White
Write-Host "  - Canal radio_playback_v3 avec setShowBadge(false)" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT : DESINSTALLER L'ANCIENNE APK AVANT D'INSTALLER !" -ForegroundColor Red
Write-Host ""
Write-Host "ETAPES SUIVANTES :" -ForegroundColor Yellow
Write-Host "  1. npx cap open android" -ForegroundColor White
Write-Host "  2. Build APK dans Android Studio" -ForegroundColor White
Write-Host "  3. Tester Android Auto avec le DHU (Desktop Head Unit)" -ForegroundColor White
Write-Host "     ou directement sur un vehicule compatible" -ForegroundColor White
Write-Host ""
Write-Host "TEST ANDROID AUTO :" -ForegroundColor Cyan
Write-Host "  - Installer 'Android Auto - Desktop Head Unit' depuis SDK Manager" -ForegroundColor White
Write-Host "  - Activer mode dev dans l'app Android Auto du telephone" -ForegroundColor White
Write-Host "  - Lancer le DHU pour simuler un ecran de voiture" -ForegroundColor White
Write-Host ""
Write-Host ">>> npx cap open android" -ForegroundColor Cyan

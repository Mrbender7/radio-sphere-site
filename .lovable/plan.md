

## v2.4.2 - Cast Audio + Android Auto Visibility

### 1. Pause audio local lors du Cast (`src/contexts/PlayerContext.tsx`)

Dans le `useEffect` qui gere le push media vers le Chromecast (lignes 529-542), ajouter :
- Un `wasCastingRef` pour detecter la transition `isCasting: false -> true`
- Quand Cast se connecte : `audio.pause()` + `stopSilentLoop()` pour couper le son local
- Quand Cast se deconnecte : `audio.play()` + `startSilentLoop()` pour reprendre le son local

### 2. Unification MediaSession (`android-auto/RadioBrowserService.java`)

Ligne 146 : Changer `"RadioSphereAuto"` en `"RadioSphereMedia"` pour correspondre au nom utilise dans `MediaPlaybackService.java` (ligne 402) et eviter les doublons dans le systeme Android.

### 3. Visibilite Android Auto (`android-auto/AndroidManifest-snippet.xml`)

- Ajouter `android:label="@string/app_name"` et `android:icon="@mipmap/ic_launcher"` sur la declaration du service `RadioBrowserService`
- Ajouter la meta-data `com.google.android.gms.car.notification.SmallIcon` pointant vers `@drawable/ic_notification`

### 4. Script PS1 (`radiosphere_v2_4_2.ps1`) - Corrections multiples

**App ID production** (le user a confirme que la detection fonctionne) :
- Ligne 586 : Remplacer `CastMediaControlIntent.DEFAULT_MEDIA_RECEIVER_APPLICATION_ID` par `"65257ADB"`
- Ligne 885 : Remplacer `CastMediaControlIntent.DEFAULT_MEDIA_RECEIVER_APPLICATION_ID` par `"65257ADB"`

**Manifest - RadioBrowserService** (lignes 168-175) :
- Ajouter `android:label="@string/app_name"` et `android:icon="@mipmap/ic_launcher"` au service
- Ajouter la meta-data SmallIcon apres le bloc service

**Manifest - RadioBrowserService MediaSession** (ligne 1022 dans le here-string) :
- Changer `"RadioSphereAuto"` en `"RadioSphereMedia"`

**Fix syntaxe PS1** :
- Ligne 695 : Le tiret long `—` dans `"Network permission callback — granted: "` doit etre remplace par un tiret standard `-` (meme correction que precedemment)

**Resume final** (lignes 1519+) :
- Ajouter les changements Android Auto (label, icon, SmallIcon, MediaSession unifiee)
- Ajouter le rappel "Sources Inconnues" pour Android Auto
- Mettre a jour l'App ID mentionne dans les logs de diagnostic

### 5. Rappel Sources Inconnues

Ajouter dans le resume final du PS1 une ligne :
`"ANDROID AUTO : Activer 'Sources inconnues' dans Parametres > Developpeur de l'app Android Auto sur le smartphone"`

### Fichiers modifies

| Fichier | Changement |
|---------|-----------|
| `src/contexts/PlayerContext.tsx` | Pause/resume audio local lors du Cast connect/disconnect |
| `android-auto/RadioBrowserService.java` | MediaSession tag "RadioSphereMedia" |
| `android-auto/AndroidManifest-snippet.xml` | label, icon, SmallIcon sur RadioBrowserService |
| `radiosphere_v2_4_2.ps1` | App ID 65257ADB, Manifest AA, MediaSession, fix tiret, resume |


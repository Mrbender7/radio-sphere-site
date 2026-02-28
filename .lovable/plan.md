

# Diagnostic et corrections : Android Auto + Chromecast

## Probleme 1 : Chromecast -- le bouton n'apparait jamais

### Cause racine identifiee

Le **Google Cast Sender SDK** (`cast_sender.js`) fonctionne **uniquement dans le navigateur Google Chrome**. Il ne fonctionne PAS dans :
- Les WebView Android (ce qu'utilise Capacitor pour l'APK)
- Safari, Firefox, ou tout autre navigateur

Quand l'app tourne dans l'APK Android via Capacitor, le SDK se charge mais `__onGCastApiAvailable` ne se declenche jamais car le WebView n'a pas d'integration Cast native. Le `isCastAvailable` reste donc toujours `false` et le bouton ne s'affiche jamais.

### Solution

Pour que le Chromecast fonctionne dans l'APK Android, il faut utiliser un **plugin Capacitor natif** qui communique avec le SDK Cast Android natif (pas le SDK web).

Deux approches possibles :

**Approche A -- Plugin Cast natif (recommandee)** : Creer un petit plugin Capacitor natif (`CastPlugin.java`) qui utilise le SDK Cast Android natif cote Java. Le code TypeScript (`useCast.ts`) appellerait ce plugin au lieu du SDK web quand on est sur Capacitor Android. Cela necessite d'ajouter la dependance `play-services-cast-framework` dans le Gradle.

**Approche B -- Mode hybride** : Garder le SDK web pour Chrome desktop (quand l'app est utilisee en PWA sur Chrome), et ajouter le plugin natif pour l'APK. Le hook `useCast.ts` detecterait automatiquement l'environnement et utiliserait le bon SDK.

### Modifications prevues

#### Fichier : `android-auto/CastPlugin.java` (nouveau)
- Plugin Capacitor natif utilisant `com.google.android.gms.cast.framework`
- Methodes : `initialize()`, `requestSession()`, `endSession()`, `loadMedia()`, `togglePlayPause()`
- Listener natif pour detecter les appareils Cast sur le reseau
- Utilise l'App ID `65257ADB`

#### Fichier : `src/hooks/useCast.ts` (modifier)
- Ajouter detection de plateforme : `Capacitor.isNativePlatform()`
- Si natif Android : appeler `CastPlugin` (Capacitor) au lieu du SDK web
- Si Chrome desktop : garder le SDK web actuel
- Ajouter des `console.log` de debug pour tracer l'initialisation

#### Fichier : `radiosphere_v2_3_0.ps1` (modifier)
- Ajouter la dependance Gradle : `implementation 'com.google.android.gms:play-services-cast-framework:22.0.0'`
- Generer `CastPlugin.java` dans le dossier du package
- Generer `CastOptionsProvider.java` (requis par le framework Cast Android)
- Ajouter `<meta-data android:name="com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME" ...>` dans le Manifest
- Enregistrer le plugin dans `MainActivity`

---

## Probleme 2 : Android Auto -- certaines stations ne demarrent pas

### Causes probables identifiees

1. **Streams HTTP bloques** : Malgre `cleartextTrafficPermitted="true"` dans `network_security_config.xml`, certaines versions d'Android ou configurations vehicule peuvent bloquer les flux HTTP. Le `playStation()` utilise `MediaItem.fromUri()` qui devrait gerer les redirections, mais certains streams utilisent des protocoles non standards (HLS `.m3u8`, playlists PLS/M3U).

2. **Formats de stream non supportes** : ExoPlayer supporte MP3/AAC/OGG natifs, mais certaines stations utilisent des playlists (`.m3u`, `.pls`) qui contiennent l'URL reelle du stream. ExoPlayer ne parse pas ces playlists automatiquement.

3. **Redirections en chaine** : Certaines stations passent par plusieurs redirections HTTP avant d'atteindre le flux reel. `HttpURLConnection` (utilise dans `httpGet()`) ne suit pas toujours toutes les redirections cross-protocol (HTTP vers HTTPS ou inversement).

### Modifications prevues

#### Fichier : `android-auto/RadioBrowserService.java` (modifier)
- Ajouter une methode `resolveStreamUrl()` qui suit manuellement les redirections HTTP/HTTPS (jusqu'a 5 niveaux) pour obtenir l'URL finale du stream
- Detecter les URLs `.m3u` et `.pls` : les telecharger et extraire l'URL du stream reel
- Dans `playStation()` : appeler `resolveStreamUrl()` avant de passer l'URL a ExoPlayer
- Ajouter un fallback : si le stream echoue apres 10s de buffering, tenter avec `http://` au lieu de `https://` (ou inversement)
- Ajouter des logs plus detailles pour chaque etape

---

## Probleme 3 : Stations sans image sur Android Auto

### Cause
La constante `DEFAULT_ARTWORK` pointe vers `https://placehold.co/512x512/1a1a2e/e94560?text=RadioSphere`, un service externe qui peut etre lent ou inaccessible depuis le vehicule.

### Solution
Utiliser une image locale embarquee dans l'APK comme placeholder. Cela garantit un affichage instantane et fiable.

#### Fichier : `android-auto/RadioBrowserService.java` (modifier)
- Remplacer `DEFAULT_ARTWORK` (URL externe) par une reference a une ressource locale : `android.resource://com.radiosphere.app/mipmap/ic_launcher`
- Dans `stationToMediaItem()` et `playStation()` : utiliser `Uri.parse("android.resource://" + getPackageName() + "/mipmap/ic_launcher")` quand le logo est vide
- Cela utilise l'icone de l'app comme placeholder -- toujours disponible, haute resolution

---

## Probleme 4 : Detection d'Android Auto necessite un redemarrage

### Explication
C'est un comportement **normal** d'Android Auto. Le `MediaBrowserServiceCompat` est decouvert par le systeme au moment de l'installation de l'APK ou au redemarrage d'Android Auto. Ce n'est pas un bug a corriger, mais on peut documenter ce comportement.

---

## Resume des fichiers

| Fichier | Action |
|---|---|
| `android-auto/CastPlugin.java` | Creer (plugin Capacitor natif pour Cast) |
| `android-auto/CastOptionsProvider.java` | Creer (requis par Cast framework Android) |
| `src/hooks/useCast.ts` | Modifier (detection plateforme, bridge natif) |
| `android-auto/RadioBrowserService.java` | Modifier (resolution URLs, playlists, placeholder local) |
| `radiosphere_v2_3_0.ps1` | Modifier (Gradle cast-framework, CastPlugin, Manifest) |


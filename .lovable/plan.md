

## Nouveau PS1 v1.1.3 : Correctifs ecran de verrouillage, double-clic, redemarrage auto, service zombie

### Analyse comparative

J'ai compare en detail les deux PS1. L'agent Android Studio a identifie 4 vrais problemes, tous valides et confirmes par le code. Voici les differences cle :

#### Bug 1 : Boutons Next/Previous sur ecran de verrouillage
- **Actuel** (`updatePlaybackState` ligne 1453) : declare `ACTION_SKIP_TO_NEXT | ACTION_SKIP_TO_PREVIOUS` dans les actions
- **Nouveau** (ligne 1475) : retire ces deux flags, ne garde que `ACTION_PLAY | ACTION_PAUSE | ACTION_STOP | ACTION_PLAY_PAUSE | ACTION_PLAY_FROM_SEARCH | ACTION_PLAY_FROM_MEDIA_ID`
- **Verdict** : Correctif valide. C'est exactement la cause — ces flags dans le `PlaybackStateCompat` declarent au systeme Android que l'app supporte skip, donc il affiche les boutons. Notre correctif precedent dans `PlayerContext.tsx` (MediaSession JS `null`) ne peut pas fonctionner car le service natif Java ecrase la MediaSession avec ses propres actions.

#### Bug 2 : Double-clic pause (desynchronisation JS/natif)
- **Actuel** (`onPlay`/`onPause` lignes 1189-1196) : `onPlay` appelle `player.play()` et `onPause` appelle `player.pause()` directement sur l'ExoPlayer natif. Le JS continue de jouer independamment.
- **Nouveau** (lignes 1204-1215) : ajoute `notifyJsToToggle()` dans `onPlay` et `onPause` pour envoyer un broadcast `TOGGLE_PLAYBACK` vers le JS. L'ExoPlayer est mis en pause dans `onPause` par securite, mais `onPlay` ne lance plus `player.play()` (le JS gere la lecture).
- **Verdict** : Correctif valide. La synchronisation bidirectionnelle est essentielle.

#### Bug 3 : Redemarrage auto apres 2-3s
- **Actuel** (`audioFocusChangeListener` ligne 897) : `AUDIOFOCUS_GAIN` appelle `player.play()` qui relance l'ExoPlayer natif
- **Nouveau** (ligne 901-903) : retire `player.play()` de `AUDIOFOCUS_GAIN`, ne fait que restaurer le volume
- **Verdict** : Correctif valide. L'AudioFocus gain ne doit pas auto-relancer.

#### Bug 4 : Service zombie apres fermeture
- **Actuel** (`ACTION_STOP` ligne 1000-1002) : fait juste `stopForeground(true)`
- **Nouveau** (lignes 1005-1009) : ajoute `forceResetPlayerForSwitch()` et `stopSelf()` pour tuer le service completement
- **Verdict** : Correctif valide. Sans `stopSelf()`, le service survit.

#### Autre ajout : `stopService` dans RadioAutoPlugin
- Le nouveau PS1 ajoute une methode `stopService` dans RadioAutoPlugin.java qui envoie `ACTION_STOP` au service. Utile pour que le JS puisse demander l'arret propre du service.

#### updateMirrorNotification : uniformisation
- L'actuel construit son propre `PlaybackStateCompat` inline avec des actions limitees. Le nouveau appelle simplement `updatePlaybackState(state)` pour garantir la coherence.

---

### Plan d'implementation

**Fichier 1** : `radiosphere_v1_1_0.ps1` — Remplacer par une version v1.1.3 integrant tous les correctifs

Changements dans le code Java genere :

1. **RadioBrowserService.java** :
   - `updatePlaybackState()` : retirer `ACTION_SKIP_TO_NEXT` et `ACTION_SKIP_TO_PREVIOUS`
   - `audioFocusChangeListener` / `AUDIOFOCUS_GAIN` : retirer `player.play()` et `updatePlaybackState(PLAYING)`
   - `mediaSessionCallback.onPlay()` : ne plus appeler `player.play()`, ajouter `notifyJsToToggle()`
   - `mediaSessionCallback.onPause()` : ajouter `notifyJsToToggle()`
   - Ajouter methode helper `notifyJsToToggle()` dans le callback
   - `ACTION_STOP` handler : ajouter `forceResetPlayerForSwitch()` + `stopSelf()`
   - `updateMirrorNotification` : appeler `updatePlaybackState(state)` au lieu de construire inline

2. **RadioAutoPlugin.java** :
   - Ajouter methode `stopService()` (envoie `ACTION_STOP` au service)

3. **Fin du script** :
   - Remplacer le `Write-Host ">>> npx cap open android"` par un vrai appel `npx cap open android`
   - Mettre a jour les messages de version (v1.1.3)

**Fichier 2** : `src/plugins/RadioAutoPlugin.ts` — Ajouter l'interface `stopService`

**Fichier 3** : `android-auto/RadioAutoPlugin.java` + `android-auto/RadioBrowserService.java` — Mettre a jour les fichiers de reference dans le repo pour rester synchronises avec le PS1

**Fichier 4** : `VERSIONS.md` — Documenter v1.1.3


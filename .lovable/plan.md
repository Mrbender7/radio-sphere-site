

## Investigation: Disparition du contenu dynamique et du mini-player sur l'ecran de verrouillage

### Bug identifie : `handlePlay` et `handlePause` ne mettent pas a jour `navigator.mediaSession`

Les fonctions `handlePlay` et `handlePause` sont les callbacks enregistres pour :
1. Les **actions MediaSession** du navigateur/WebView (ecran de verrouillage)
2. L'evenement **`mediaToggle`** de la notification native Android

**Probleme** : ces deux fonctions ne mettent jamais a jour `navigator.mediaSession.playbackState` ni ne rafraichissent le `MediaMetadata`. Or, `play()` et `togglePlay()` le font correctement.

```text
play()       → updateMediaSession() ✅  + mediaSession.playbackState ✅
togglePlay() → updateMediaSession() ✅  + mediaSession.playbackState ✅
handlePlay() → aucun des deux ❌
handlePause()→ aucun des deux ❌
```

Quand l'utilisateur utilise les controles de l'ecran de verrouillage :
- Le systeme Android appelle `handlePlay`/`handlePause`
- Le `playbackState` MediaSession n'est pas mis a jour
- Android interprete que la session est "morte" et retire la notification

### Correctif : `PlayerContext.tsx`

**`handlePlay`** — ajouter :
```tsx
if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
setState(s => {
  if (s.currentStation) {
    notifyNativePlaybackState(s.currentStation, true);
    updateMediaSession(s.currentStation, true);  // <-- AJOUT
  }
  return { ...s, isPlaying: true };
});
```

**`handlePause`** — ajouter :
```tsx
if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
setState(s => {
  if (s.currentStation) {
    notifyNativePlaybackState(s.currentStation, false);
    updateMediaSession(s.currentStation, false);  // <-- AJOUT
  }
  return { ...s, isPlaying: false };
});
```

### Probleme secondaire : warnings ref sur TimebackMachine et CassetteAnimation

Les logs console montrent :
- "Function components cannot be given refs — Check the render method of `FullScreenPlayer`" pour `TimebackMachine`
- "Function components cannot be given refs — Check the render method of `TimebackMachine`" pour `CassetteAnimation`

Ce ne sont que des warnings (pas de crash), mais ils sont faciles a corriger en wrappant les composants avec `React.forwardRef` ou en supprimant les refs inutiles. Cependant, en examinant le code, **aucun ref n'est explicitement passe** a ces composants dans FullScreenPlayer ni TimebackMachine. Ces warnings viennent probablement de framer-motion ou d'un parent qui tente de passer un ref. Pas d'impact fonctionnel.

### Fichier modifie
- `src/contexts/PlayerContext.tsx` — `handlePlay` et `handlePause` : ajouter `mediaSession.playbackState` + `updateMediaSession()`

### Dependance
- `updateMediaSession` doit etre ajoute aux deps de `handlePlay` et `handlePause` (il est deja `useCallback` avec `[]` donc stable)


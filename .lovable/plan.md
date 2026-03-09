

## Correctif : Double-clic pause + redemarrage intempestif

### Cause racine identifiee

**Bug 1 (double-clic)** et **Bug 2 (redemarrage auto)** ont la meme origine : la fonction `keepAlive` (ligne 376).

Quand l'utilisateur appuie sur pause depuis l'ecran de verrouillage ou le dynamic content, Android peut declencher un evenement `visibilitychange` (l'app revient brievement au premier plan) **avant** que le handler `handlePause` ne s'execute. La sequence problematique :

```text
1. Utilisateur appuie pause sur ecran de verrouillage
2. Android → visibilitychange 'visible' → keepAlive() voit isPlayingRef = true → audio.play() (async)
3. handlePause() s'execute → isPlayingRef = false, audio.pause()
4. audio.play() de l'etape 2 se resout APRES → relance la lecture
5. L'icone a change (pause→play) mais l'audio joue toujours
```

Meme phenomene quand on rouvre l'app : `keepAlive` relance la lecture meme si l'utilisateur avait volontairement mis en pause.

Probleme secondaire : `handlePause` ne nettoie pas `retryTimerRef`, donc un timer `stalled`/`ended` programme avant la pause peut relancer la lecture 2s plus tard.

### Correctif dans `PlayerContext.tsx`

**1. `keepAlive` — ajouter un delai de 500ms**

Laisser le temps a `handlePause`/`handlePlay` de s'executer avant de verifier l'etat :

```tsx
const keepAlive = () => {
  if (document.visibilityState === 'visible') {
    setTimeout(() => {
      if (isPlayingRef.current) {
        audio.play().catch(() => {});
        startSilentLoop();
        requestWakeLock();
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
      }
    }, 500);
  }
};
```

**2. `handlePause` — nettoyer `retryTimerRef`**

Empecher les timers de relance programmes (stalled/ended) de redemarrer la lecture apres une pause intentionnelle :

```tsx
const handlePause = useCallback(() => {
  // ... existing code ...
  // AJOUT : annuler tout timer de relance programme
  if (retryTimerRef.current) {
    clearTimeout(retryTimerRef.current);
    retryTimerRef.current = null;
  }
}, [releaseWakeLock, stopHeartbeat, updateMediaSession]);
```

**3. Heartbeat — distinguer pause intentionnelle de stream mort**

Le heartbeat voit `audio.paused === true` et considere le stream comme mort. Si l'utilisateur a volontairement mis en pause, il ne faut pas recharger :

```tsx
// Dans le heartbeat, remplacer le check isDead
const isDead = (audio.paused && isPlayingRef.current) ||  // paused mais on devrait jouer = mort
  audio.networkState === 3 ||
  (audio.readyState < 2 && !audio.paused);
```

Actuellement `audio.paused` seul declenche le reload. Avec `isPlayingRef.current` en garde, une pause intentionnelle (ref = false) n'est plus consideree comme un stream mort.

### Fichier modifie
- `src/contexts/PlayerContext.tsx` : 3 modifications (keepAlive, handlePause, heartbeat)




## Correctif : double-clic pause, redemarrage auto, boutons navigation inutiles

### Probleme 1 : Boutons avant/arriere inutiles

Ligne 281-286 de `PlayerContext.tsx` :
```tsx
const noop = () => {};
navigator.mediaSession.setActionHandler('seekbackward', noop);
navigator.mediaSession.setActionHandler('seekforward', noop);
```

Definir un handler (meme `noop`) **active le bouton** dans le dynamic content / lock screen. Android affiche le bouton des qu'un handler est enregistre. Pour les masquer, il faut passer `null` au lieu de `noop`. Il faut aussi explicitement desactiver `previoustrack` et `nexttrack`.

**Correctif** : Remplacer les handlers `noop` par `null` et ajouter `previoustrack`/`nexttrack` a `null` :

```tsx
navigator.mediaSession.setActionHandler('play', handlePlay);
navigator.mediaSession.setActionHandler('pause', handlePause);
navigator.mediaSession.setActionHandler('stop', handlePause);
navigator.mediaSession.setActionHandler('seekbackward', null);
navigator.mediaSession.setActionHandler('seekforward', null);
navigator.mediaSession.setActionHandler('previoustrack', null);
navigator.mediaSession.setActionHandler('nexttrack', null);
```

Cleanup identique dans le `return`.

---

### Probleme 2 : Double-clic pause + redemarrage auto apres 2-3s

Le delai `keepAlive` de 500ms n'est pas suffisant. Sur certains appareils Android, l'evenement `visibilitychange` arrive bien apres le handler MediaSession. De plus, quand l'utilisateur ramene l'app au premier plan apres avoir mis en pause, `keepAlive` detecte `isPlayingRef = true` si l'evenement de visibilite arrive avant que `handlePause` ait eu le temps de s'executer.

**Correctif — timestamp de pause intentionnelle** :

Ajouter un `pausedAtRef = useRef<number>(0)` qui enregistre `Date.now()` a chaque pause intentionnelle. Dans `keepAlive`, ignorer si une pause a eu lieu dans les 2 dernieres secondes :

```tsx
// Dans handlePause :
pausedAtRef.current = Date.now();

// Dans keepAlive :
setTimeout(() => {
  const recentPause = Date.now() - pausedAtRef.current < 2000;
  if (isPlayingRef.current && !recentPause) {
    audio.play().catch(() => {});
    // ...
  }
}, 500);
```

Meme garde dans `handleStalled` et `handleEnded` pour empecher un retry si une pause intentionnelle vient d'avoir lieu :

```tsx
const handleStalled = () => {
  if (!isPlayingRef.current) return;
  if (Date.now() - pausedAtRef.current < 3000) return; // pause recente, ignorer
  // ... reste inchange
};
```

---

### Resume des modifications

**Fichier** : `src/contexts/PlayerContext.tsx`

1. Ajouter `pausedAtRef = useRef<number>(0)` dans les refs
2. Dans `handlePause` : ajouter `pausedAtRef.current = Date.now()`
3. Dans `keepAlive` : ajouter garde `recentPause`
4. Dans `handleStalled` / `handleEnded` : ajouter garde `pausedAtRef`
5. Remplacer `seekbackward`/`seekforward` noop par `null`, ajouter `previoustrack`/`nexttrack` a `null`




## Diagnostic : Pourquoi le bouton REC et la barre TimeMachine ont disparu

### Cause racine

`captureStream()` lance une `SecurityError` sur **toute** source audio cross-origin (= tous les flux radio). Le `catch` fait exactement ce qu'il doit faire : il met `bufferAvailable = false` et `recordingAvailable = false`. L'UI réagit correctement en masquant le bouton REC et la barre de seek-back.

**Le problème n'est pas un bug — c'est une limitation fondamentale du navigateur.** `captureStream()` est soumis aux mêmes restrictions CORS que `fetch()`. On a remplacé un système qui marchait (fetch + proxy) par un système qui ne peut pas fonctionner sur les flux radio cross-origin.

### Solution proposée : revenir à fetch direct SANS proxy

Le vrai problème était `corsproxy.io` qui injectait des pubs. La solution n'est pas d'abandonner `fetch()`, mais d'abandonner le proxy :

1. **Tenter un `fetch()` direct** sur l'URL du flux radio
2. **Si ça marche** (le serveur envoie des headers CORS) → buffer et enregistrement disponibles
3. **Si ça échoue** (pas de CORS) → `bufferAvailable = false`, la lecture continue normalement via `<audio>`, pas de buffer/REC mais pas de crash

### Modifications dans `src/contexts/StreamBufferContext.tsx`

- **Remplacer** `startCapture()` (MediaRecorder/captureStream) par `startFetch()` simplifié :
  - `fetch(streamUrl)` direct, sans aucun proxy ni fallback CORS
  - Lire le `ReadableStream` et pousser les chunks dans `chunksRef` (même format `TimestampedChunk`)
  - Si le fetch échoue (CORS, réseau) → `bufferAvailable = false`, log warning, pas de crash
- **Supprimer** les refs liées à MediaRecorder : `captureRecorderRef`, `webmHeaderRef`, `isFirstChunkRef`
- **Ajouter** `fetchControllerRef` (AbortController) pour pouvoir stopper le fetch
- **Le MIME type** sera détecté depuis le `Content-Type` de la réponse, ou fallback `audio/mpeg`
- **`seekBack()`** : les chunks sont du MP3/AAC brut (pas du WebM), donc pas besoin de header spécial — le blob est directement jouable
- **`stopRecording()`** : même logique, extension `.mp3` ou basée sur le codec détecté

### Ce qui ne change pas

- Toute la logique buffer circulaire, `trimBuffer`, `updateBufferSeconds`
- `startRecording` avec la logique seek-back index
- `handleBlobEnded` transition seek→live pendant enregistrement
- `returnToLiveInternal`
- Aucun autre fichier modifié

### Résultat attendu

- Stations avec CORS activé → buffer + REC + TimeMachine fonctionnels, sans pub
- Stations sans CORS → lecture normale, buffer désactivé silencieusement
- Zéro dépendance à un proxy externe


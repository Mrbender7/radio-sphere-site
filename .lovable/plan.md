

## Diagnostic complet : Pourquoi la Timeback Machine ne fonctionne plus

### Bug identifie : le garde `isPlaying` tue le fetch et empeche son redemarrage

Dans le dernier changement, j'ai ajoute un garde `isPlaying` dans le `useEffect` de `StreamBufferContext.tsx` (ligne 195). C'est **le bug principal** :

```text
FLUX NORMAL (avant mon changement):
  Station selectionnee → fetch demarre immediatement → chunks arrivent → buffer se remplit

FLUX CASSE (apres mon changement):
  Station selectionnee → isPlaying=false (buffering audio) → stopFetch() → fetch JAMAIS lance
  ... canplay arrive → isPlaying=true → stationId deja = stationIdRef → PAS de nouveau fetch!
  
  Pire: si l'utilisateur fait PAUSE → isPlaying=false → stopFetch() → fetch tue
  Resume → isPlaying=true → stationId === stationIdRef → fetch JAMAIS relance
  Le buffer est mort pour toujours.
```

La memoire du projet le dit explicitement : "Le tampon s'active des qu'une URL de flux est presente, **sans attendre isPlaying**."

### Deuxieme probleme : CORS sur le web preview

Sur la preview web (HTTPS), `fetch()` vers un serveur Icecast sans header `Access-Control-Allow-Origin` est bloque par le navigateur. Certains serveurs l'envoient (d'ou le "Flux connecte" dans les logs), d'autres non. Sur **Android/Capacitor**, ce probleme n'existe pas car la WebView contourne CORS nativement.

Les logs montrent "Flux connecte" mais aucun "Chunk received" — cela confirme soit un blocage CORS au niveau du body, soit que le snapshot des logs a ete pris trop tot.

### Plan de correction

**Fichier unique modifie : `src/contexts/StreamBufferContext.tsx`**

#### 1. Supprimer le garde `isPlaying` (lignes 192-210)

Revenir au comportement original : le fetch demarre des que `currentStation?.streamUrl` existe, independamment de `isPlaying`. Le fetch ne s'arrete que quand la station change ou disparait.

```tsx
// AVANT (casse):
if (!currentStation?.streamUrl || !isPlaying) {
  stopFetch();
  ...
}

// APRES (corrige):
if (!currentStation?.streamUrl) {
  stopFetch();
  clearBuffer();
  stationIdRef.current = null;
  return;
}
if (stationId !== stationIdRef.current) {
  stationIdRef.current = stationId;
  clearBuffer();
  startFetch(currentStation.streamUrl);
}
```

Retirer `isPlaying` des deps du useEffect : `[currentStation?.id, currentStation?.streamUrl, startFetch, stopFetch, clearBuffer]`

#### 2. Ajouter un compteur de chunks visible dans les logs

Garder le `console.log("[StreamBuffer] Chunk received:", value.byteLength)` mais ajouter un compteur pour confirmer visuellement que ca fonctionne : log uniquement tous les 50 chunks pour ne pas saturer la console.

#### 3. Gestion CORS gracieuse

Le catch CORS est deja en place et fonctionne. Pas de changement necessaire. Sur web, `bufferAvailable` restera `false` et le bouton TBM sera desactive — c'est le comportement attendu. Sur Android, ca fonctionnera directement.

### Ce qui ne change PAS
- `PlayerContext.tsx` — aucune modification
- `TimebackMachine.tsx` — aucune modification  
- Architecture Provider (App.tsx) — correcte
- `returnToLiveInternal` — deja corrige (URL directe, pas de proxy)
- `seekBack` — logique blob correcte

### Resume
Un seul fichier, une correction chirurgicale : supprimer le garde `isPlaying` qui empeche le fetch de demarrer et de redemarrer apres pause.


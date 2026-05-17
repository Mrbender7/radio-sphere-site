## Objectif

Ajouter un système d'auto-guérison Vanilla JS dans `public/lite.html` : les flux qui échouent 3 fois sont bannis et remplacés automatiquement par des stations de réserve, sans toucher à React.

## Règles strictes

- **Préfixe obligatoire** sur toutes les clés localStorage : `rs_lite_` (zéro collision avec l'app React).
- **Aucune dépendance** ajoutée, pas de React, pas de modification d'architecture.
- Tous les accès `localStorage` enveloppés dans `try/catch` (WebView FB/IG peuvent throw).

## Implémentation

### 1. Constantes et helpers (en tête du `<script>`)

```text
LIMIT_PER_CATEGORY = 20
KEY_ERRORS  = "rs_lite_errors_"          // + station.n
KEY_BANNED  = "rs_lite_banned_stations"  // JSON array de noms
MAX_STRIKES = 3
```

Helpers ajoutés :
- `lsGet(key)` / `lsSet(key, val)` — wrappers try/catch
- `getBanned()` → `string[]` (parse JSON, fallback `[]`)
- `addBanned(name)` → push + dedupe + persist
- `getStrikes(name)` / `bumpStrikes(name)` → renvoie le nouveau compteur

### 2. Filtrage au rendu (`render()`)

Avant la boucle de génération des cartes :
1. Lire `banned = getBanned()`
2. Filtrer la liste source : `STATIONS.filter(s => banned.indexOf(s.n) === -1)`
3. Appliquer ensuite le filtre catégorie + recherche existants
4. Slicer à `LIMIT_PER_CATEGORY` (20) — le reste reste en réserve naturelle

Les stations bannies ne sont jamais injectées dans le DOM ; la réserve remonte automatiquement.

### 3. Tracking des strikes (`.catch` de `safePlay`)

Dans le `.catch(error)` du `audioPlayer.play()` :
```text
const n = currentStation.n;
const strikes = bumpStrikes(n);          // +1 et persist
if (strikes >= MAX_STRIKES) addBanned(n);
if (window.umami) umami.track('stream-dead-lite', { station: n });
re-render() pour évincer la carte si elle vient d'être bannie
```

Également déclenché sur l'event `error` de l'`<audio>` (même cause, flux mort serveur-side).

### 4. Reset partiel sur succès

Sur l'event `playing` (lecture qui démarre vraiment), supprimer `rs_lite_errors_<name>` pour éviter qu'une station fiable mais ayant eu un hoquet ponctuel finisse bannie au bout de plusieurs sessions.

### 5. Télémétrie

`umami.track('stream-dead-lite', { station: name })` dans le `.catch`, guard `typeof window.umami !== 'undefined'`.

## Fichier modifié

- `public/lite.html` uniquement (script inline Vanilla JS)

## Hors scope

- Pas de UI d'admin pour vider la liste bannie (les clés sont visibles via DevTools si besoin de debug)
- Pas de TTL sur le bannissement (peut être ajouté plus tard si demandé)
- Aucun fichier React touché
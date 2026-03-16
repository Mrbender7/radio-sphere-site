

## Plan : Correction moteur de recherche — TERMINÉ ✅

### Problèmes corrigés

| # | Problème | Correction |
|---|----------|------------|
| 1 | Tri alphabétique ne fonctionnait pas après fusion multi-requêtes | Ajout `sortStations()` côté client après chaque fusion/dedup |
| 2 | Recherche genre+mot-clé trop restrictive (`tag: "genre,query"`) | Remplacé par `tag: genre, name: query` + recherche `name` seule |
| 3 | Fusion multi-genre fragile (double `Array.isArray` check) | Simplifié : chaque requête retourne `RadioStation[]`, fusion plate via `mergeSettled` |
| 4 | `clickcount` manquant dans le modèle | Ajouté dans `RadioStation`, `normalizeStation`, et `AboutPage` |

### Fichiers modifiés

| Fichier | Changement |
|---------|------------|
| `src/types/radio.ts` | Ajout champ `clickcount: number` |
| `src/services/RadioService.ts` | `normalizeStation` inclut `clickcount` |
| `src/pages/SearchPage.tsx` | Tri client `dedupeAndSort`/`sortStations`, logique recherche corrigée, fusion simplifiée |
| `src/pages/AboutPage.tsx` | Ajout `clickcount: 0` dans import CSV |

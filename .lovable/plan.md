

## Analyse du moteur de recherche — Problèmes identifiés

### Comment ça fonctionne actuellement

Quand tu tapes un mot-clé (ex: "jazz"), le code lance **2 requêtes parallèles** à l'API Radio Browser :
1. Recherche par **nom** (`name: "jazz"`) — stations dont le titre contient "jazz"
2. Recherche par **tag** (`tag: "jazz"`) — stations étiquetées "jazz"

Les résultats sont fusionnés sans doublons (via `Map` sur l'`id`). **Donc oui, le principe est bon : ça additionne les résultats nom + tags.**

### Problème 1 : Le tri alphabétique ne fonctionne pas

Le tri (`order: "name"`, `order: "votes"`, etc.) est envoyé **à l'API** pour chaque requête individuelle. Mais quand les résultats de 2+ requêtes sont **fusionnés côté client**, aucun re-tri n'est appliqué. Les résultats apparaissent dans l'ordre d'insertion dans le `Map`, ce qui mélange tout.

**Correction** : Ajouter un tri côté client après la fusion, selon `sortBy` actif.

### Problème 2 : Résultats potentiellement manquants

- Chaque requête est limitée à `PAGE_SIZE = 40`. Si la recherche par nom renvoie 40 résultats et la recherche par tag aussi, on obtient au mieux ~80 stations (moins les doublons). C'est correct.
- **Mais** : quand on combine genre + mot-clé, la 2e requête utilise `tag: "genre,motclé"` ce qui cherche les stations ayant **les deux tags simultanément** — très restrictif. Il faudrait plutôt chercher par `tag: genre` + `name: motclé` séparément.
- Le "Load more" avec offset peut aussi rater des résultats car l'offset s'applique indépendamment à chaque requête fusionnée.

### Problème 3 : Multi-genre + query — bug de structure

Dans le bloc multi-genre avec query, `mergeSettled` est appelé sur des résultats qui sont eux-mêmes des tableaux fusionnés. Le code tente de gérer ça avec des vérifications `Array.isArray(s)`, mais c'est fragile et peut perdre des résultats.

---

### Plan de correction

#### 1. Tri côté client après fusion
- Dans le `useQuery` de recherche et dans `loadMore`, appliquer un `.sort()` sur le tableau final selon `sortBy` :
  - `"name"` → tri alphabétique insensible à la casse
  - `"votes"` → tri décroissant par votes
  - `"clickcount"` → tri décroissant par clickcount
- Même chose dans le `useEffect` qui combine `results` + `extraResults`

#### 2. Corriger la logique de recherche genre + mot-clé
- Au lieu de `tag: "genre,query"`, faire `tag: genre, name: query` — chercher les stations du genre dont le **nom** contient le mot-clé
- Garder aussi la recherche `name: query` seule (sans filtre de tag) pour capturer les stations non taguées mais pertinentes par leur nom

#### 3. Simplifier la fusion multi-genre
- Aplatir proprement les résultats au lieu de la double vérification `Array.isArray` / `"id" in s`
- S'assurer que chaque branche de recherche renvoie directement un `RadioStation[]`

#### 4. Ajouter `clickcount` au modèle
- Le type `RadioStation` n'a pas de champ `clickcount` — l'ajouter dans `normalizeStation` et dans l'interface pour que le tri par clics fonctionne réellement

#### Fichiers modifiés
- `src/pages/SearchPage.tsx` — tri client, correction logique de recherche, simplification fusion
- `src/types/radio.ts` — ajout `clickcount`
- `src/services/RadioService.ts` — ajout `clickcount` dans `normalizeStation`


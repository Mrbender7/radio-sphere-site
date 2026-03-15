

## Ajout de modes d'affichage dans les Favoris

### Actuellement
La page Favoris affiche uniquement en mode **liste compacte** (une ligne par station). Le `StationCard` supporte deux modes : `compact` (liste) et le mode par défaut (petite vignette 5.5rem utilisée dans les scrollables de la HomePage).

### Ce qu'on va faire

Ajouter un sélecteur de vue (icônes) à côté des boutons de tri, avec 3 modes :
- **Liste** (actuel `compact`) — une ligne par station
- **Vignettes moyennes** — grille de cartes ~8rem avec artwork + nom en dessous
- **Vignettes larges** — grille de cartes ~12rem avec artwork large + nom en dessous

Le nom sous la vignette utilisera le dégradé du thème (primary → violet). Le coeur favori reste sur l'artwork. Les tris (alpha, pays, genre) restent fonctionnels dans tous les modes.

### Fichiers modifiés

**`src/components/StationCard.tsx`**
- Remplacer le prop `compact?: boolean` par `viewMode?: "list" | "medium" | "large"`
- `"list"` = rendu compact actuel
- `"medium"` = vignette ~8rem artwork, nom gradient en dessous
- `"large"` = vignette ~12rem artwork, nom gradient + pays en dessous
- Mode par défaut (sans prop) = ancien rendu pour les scrollables

**`src/pages/LibraryPage.tsx`**
- Ajouter un state `viewMode` (`"list" | "medium" | "large"`)
- Ajouter 3 icônes (List, Grid3x3, LayoutGrid) à côté des boutons de tri
- Selon le `viewMode`, wrapper les stations dans une grille CSS adaptée ou en liste
- Passer `viewMode` à chaque `StationCard`

**`src/i18n/translations.ts`**
- Ajouter les clés `favorites.viewList`, `favorites.viewMedium`, `favorites.viewLarge` (5 langues)

### Détail visuel des vignettes

```text
┌─────────────┐   ┌───────────────────┐
│  ♥     8rem │   │  ♥          12rem │
│   artwork   │   │                   │
│             │   │     artwork       │
└─────────────┘   │                   │
  Station Name    └───────────────────┘
   (gradient)       Station Name
                     (gradient)
                     Country
```

La grille s'adapte : `grid-cols-3 sm:grid-cols-4 lg:grid-cols-5` pour medium, `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` pour large.


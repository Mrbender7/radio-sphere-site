

## Plan d'implémentation — View modes + animations + renommage sidebar

### 4 fichiers à modifier

#### 1. `src/components/StationCard.tsx`
- Étendre le type : `export type StationViewMode = "small" | "list" | "medium" | "large"`
- Ajouter un bloc `if (mode === "small")` avant le bloc `"list"` existant : vignette carrée compacte, artwork aspect-square piloté par la grille parent, petit coeur overlay (w-2.5), nom en `text-[10px]` avec gradient thème en dessous, pas de pays

#### 2. `src/pages/LibraryPage.tsx`
- Importer `Grip` de lucide-react
- Ajouter `"small"` dans `viewModes` avec icône `Grip`
- Ajouter le cas `"small"` dans `gridClass` : `grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-9 gap-1.5`
- Ajouter `key={viewMode}` et `animate-fade-in` sur le div dans `renderStations`

#### 3. `src/pages/SearchPage.tsx`
- Importer `StationViewMode` depuis StationCard et `List, Grid3x3, LayoutGrid, Grip` de lucide-react
- Ajouter un state `viewMode` (défaut `"list"`) après les states existants (~ligne 100)
- Après les boutons de tri (~ligne 454), ajouter un séparateur + 4 toggles de vue (small/list/medium/large)
- Remplacer `<StationCard ... compact ...>` par `<StationCard ... viewMode={viewMode} ...>`
- Wrapper les résultats dans un div avec `key={viewMode}`, `animate-fade-in`, et la classe de grille correspondante au mode

#### 4. `src/i18n/translations.ts`
- Renommer `nav.explore` dans chaque langue :
  - FR: `"Rechercher et explorer"`, EN: `"Search & Explore"`, ES: `"Buscar y explorar"`, DE: `"Suchen & Entdecken"`, JA: `"検索と探索"`
- Ajouter `favorites.viewSmall` après `favorites.viewLarge` dans chaque langue :
  - FR: `"Mini vignettes"`, EN: `"Small thumbnails"`, ES: `"Miniaturas pequeñas"`, DE: `"Kleine Kacheln"`, JA: `"小サムネイル"`


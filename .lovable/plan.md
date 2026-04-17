

## Plan : Support de l'arabe avec interface RTL

### Vue d'ensemble
Ajouter l'arabe (`ar`) comme 14e langue, avec basculement automatique de l'interface en RTL (right-to-left) lorsque la langue est sélectionnée. L'inversion sera gérée principalement via l'attribut natif `dir="rtl"` sur `<html>` que le navigateur propage à toute la mise en page Flexbox/Grid existante, ce qui évite de réécrire les centaines de classes Tailwind du projet.

### Fichiers à modifier

**1. `src/i18n/translations.ts`**
- Ajouter `"ar"` au type `Language`.
- Ajouter une entrée dans `LANGUAGE_OPTIONS` : `{ value: "ar", flag: "🇸🇦", flagUrl: "https://flagcdn.com/w40/sa.png", label: "العربية" }`.
- Ajouter le bloc `ar: { ... }` avec les ~330 clés traduites en arabe (couvrant nav, home, welcome, player, sidebar, tbmModal, tbmQuota, settings, footer, privacy, about, favorites, search, library, genres). Les clés clés demandées seront intégrées :
  - `nav.home` → الرئيسية
  - `nav.search` / `nav.explore` → بحث
  - `nav.favorites` → المفضلة
  - `nav.settings` / `nav.about` → الإعدادات / حول
  - `home.recentlyPlayed` → الإذاعات الأخيرة
  - `tbm` titles → آلة الزمن
  - `welcome.allStations` → جميع الإذاعات
  - `welcome.chooseLanguage` → اللغة
  - + le reste du dictionnaire complet pour ne pas avoir d'écran moitié anglais/moitié arabe.

**2. `src/contexts/LanguageContext.tsx`**
- Ajouter `"ar"` à `SUPPORTED_LANGUAGES`.
- Dans le `useEffect` qui synchronise `document.documentElement.lang`, ajouter aussi :
  ```ts
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  ```
  Ceci propage automatiquement la direction RTL à tout l'arbre DOM. Tailwind/Flexbox inversent alors naturellement l'ordre visuel des éléments (sidebar à droite, marges miroir via les utilitaires logiques existants, etc.).

**3. `src/index.css`**
- Ajouter une famille de polices arabes via Google Fonts (`Noto Sans Arabic`) en import au début du fichier, déjà dans le même bloc que les autres fonts.
- Ajouter une règle ciblée :
  ```css
  html[dir="rtl"] body { font-family: 'Noto Sans Arabic', system-ui, sans-serif; text-align: right; }
  ```
- Ajouter quelques règles utilitaires globales pour inverser uniquement les **icônes directionnelles** (chevrons, flèches « retour/suivant »), sans toucher aux icônes médias :
  ```css
  html[dir="rtl"] .rtl-flip { transform: scaleX(-1); }
  ```

**4. Icônes directionnelles à marquer `rtl-flip`**
Ajouter la classe `rtl-flip` uniquement aux icônes directionnelles, en laissant Play/Pause/Stop/Record/Circle intactes :
- `src/components/DesktopSidebar.tsx` : les `ChevronLeft`/`ChevronRight` du bouton collapse.
- `src/pages/HomePage.tsx` : `ChevronRight` du bouton « voir plus ».
- `src/pages/WelcomePage.tsx` : `ChevronRight` du bouton « Continuer ».
- `src/components/TimebackMachine.tsx` : icônes `Rewind` et `FastForward` (ce sont des flèches directionnelles, donc à miroiter en RTL pour rester cohérentes — passé à droite, futur à gauche).
- `src/components/ui/breadcrumb.tsx`, `pagination.tsx`, `carousel.tsx`, `dropdown-menu.tsx`, `calendar.tsx` : ajouter `rtl-flip` sur les chevrons/arrows internes (ces composants shadcn sont utilisés ailleurs).

**5. Sidebar à droite en mode RTL**
Aucun changement nécessaire dans `src/pages/Index.tsx` : avec `dir="rtl"` sur `<html>`, le conteneur Flex parent inverse automatiquement l'ordre `DesktopSidebar` ↔ contenu principal. La bordure droite de la sidebar (`border-r`) deviendra visuellement à gauche, ce qui est correct. Le bouton collapse `-right-5` reste correct visuellement (devient à gauche en RTL — l'utilisateur arabe s'attend à le trouver vers le centre, ce qui est le cas).

**6. Timeback Machine — cohérence RTL**
- Le slider de temps reste positionné de gauche à droite physiquement, mais en RTL le « passé » apparaîtra naturellement à droite et le « live » à gauche, ce qui correspond à la convention de lecture arabe. Les icônes `Rewind`/`FastForward` recevront `rtl-flip` pour pointer dans la direction cohérente. Les labels temps (`-formatTime`) restent identiques.

### Détails techniques

- **Pas d'AbortController de plugin Tailwind RTL** : on s'appuie sur le comportement natif de `dir="rtl"` qui inverse Flex/Grid, plus la classe utilitaire `rtl-flip` appliquée chirurgicalement. Cela évite une dépendance et reste léger.
- **Détection initiale** : `detectInitialLanguage` détectera déjà `navigator.language === "ar-*"` grâce à la boucle `startsWith` existante, dès que `"ar"` sera ajouté à `SUPPORTED_LANGUAGES`.
- **Page de bienvenue** : `WelcomePage` applique aussi `dir` immédiatement quand l'utilisateur sélectionne arabe dans le `<Select>` (via un `useEffect` local sur `selectedLang`).
- **Polices** : Noto Sans Arabic ajouté seulement pour `dir="rtl"` afin de ne pas pénaliser le poids de chargement pour les autres langues.

### Hors périmètre
- Pas de traduction des contenus dynamiques venant de l'API Radio Browser (noms de stations, tags) — ils restent dans la langue d'origine.
- Pas d'inversion des `AudioVisualizer` ni des animations cassette (visuels symétriques).




# Plan d'implémentation des 7 améliorations

## 1. Traduire les textes hardcodés restants

**Fichiers** : `translations.ts`, `DesktopSidebar.tsx`, `Footer.tsx`, `AboutPage.tsx`

- Ajouter les clés i18n (5 langues) :
  - `footer.poweredBy` : "Propulsé par l'incroyable {link}. Merci à Alex Segler pour ce projet communautaire."
  - `footer.createdBy` : "Créé par Franck Malherbe"
- Remplacer les textes hardcodés "Powered by the amazing…" et "Créé par Franck Malherbe" dans `DesktopSidebar`, `Footer`, et `AboutPage` par `t("footer.poweredBy")` et `t("footer.createdBy")`.
- Note : NotFound et section CTA Android sont déjà traduits (corrections précédentes).

## 2. Intégrer le Footer sur desktop

**Fichiers** : `Index.tsx`, `Footer.tsx`

- Le composant `Footer` existe et est complet mais inutilisé.
- L'intégrer dans le flux de contenu desktop, visible en bas du contenu scrollable (à l'intérieur du `renderContent()` wrapper ou après).
- Le Footer ne doit s'afficher que sur desktop (`hidden lg:block`) car le mobile a le `BottomNav`.

## 3. PWA / Service Worker

**Fichiers** : `package.json`, `vite.config.ts`, `public/manifest.json`, `index.html`

- Installer `vite-plugin-pwa`.
- Créer `public/manifest.json` avec les icônes existantes (192x192, 512x512, apple-touch-icon), `theme_color`, `display: standalone`.
- Configurer `VitePWA()` dans `vite.config.ts` avec `registerType: 'autoUpdate'`, workbox `navigateFallbackDenylist: [/^\/~oauth/]`.
- Ajouter `<link rel="manifest" href="/manifest.json">` dans `index.html`.

## 4. Accessibilité (a11y)

**Fichiers** : `StationCard.tsx`, `MiniPlayer.tsx`, `BottomNav.tsx`, `OnboardingBanner.tsx`

- Ajouter `aria-label` sur les boutons play/pause (ex: `aria-label={t("player.play")}` / `t("player.pause")`).
- Ajouter `aria-label` sur les boutons favori (ex: `aria-label="Add to favorites"` / `"Remove from favorites"`).
- Ajouter `role="navigation"` sur `BottomNav` et `DesktopSidebar`.
- Traduire le `aria-label="Fermer"` hardcodé dans `OnboardingBanner`.
- Ajouter clés i18n nécessaires pour les labels ARIA.

## 5. Lazy loading des pages

**Fichier** : `Index.tsx`

- Remplacer les imports statiques de `SearchPage`, `LibraryPage`, `AboutPage`, `PrivacyPolicyPage` par `React.lazy()`.
- Wrapper le `renderContent()` dans un `<Suspense fallback={<Loader />}>`.
- `HomePage` reste en import statique (page d'accueil, chargement immédiat).

## 6. ErrorBoundary global

**Fichiers** : nouveau `src/components/ErrorBoundary.tsx`, `App.tsx`

- Créer un composant classe `ErrorBoundary` avec `componentDidCatch`, affichant un écran de fallback élégant (logo, message d'erreur, bouton "Recharger").
- L'envelopper autour du contenu principal dans `App.tsx`.

## 7. Tests unitaires

**Fichiers** : nouveaux fichiers de test

- `src/hooks/__tests__/useFavorites.test.ts` : tester toggle, isFavorite, import, persistance localStorage.
- `src/hooks/__tests__/useWeeklyDiscoveries.test.ts` : tester la logique de découvertes hebdomadaires.
- `src/contexts/__tests__/LanguageContext.test.tsx` : tester détection de langue, changement, traduction.
- Vérifier que le setup Vitest existant fonctionne (il est déjà configuré).

---

**Ordre d'implémentation** : 1 → 2 → 5 → 6 → 3 → 4 → 7 (du plus simple au plus complexe, PWA et tests en dernier).


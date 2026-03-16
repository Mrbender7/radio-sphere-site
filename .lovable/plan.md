

# Audit complet de Radio Sphere

## Etat des lieux : ce qui fonctionne bien

- **Architecture** : SPA propre, routing par tab interne (pas de routes multiples inutiles), contextes React bien séparés (Player, Favorites, Language, SleepTimer, StreamBuffer).
- **i18n** : 5 langues complètes (FR, EN, ES, DE, JA), cohérentes sur toutes les pages.
- **Sécurité** : CSP solide dans `index.html` et `public/_headers`, liens externes avec `rel="noopener noreferrer"`.
- **SEO** : balises meta OG/Twitter, schema.org, canonical, robots.txt en place.
- **Umami Analytics** : correctement intégré, documenté dans la politique de confidentialité (React + HTML statique).
- **Onboarding** : bandeau présent sur Home et About, mention "Zéro Pub Ajoutée" avec disclaimer sur les flux tiers.
- **Privacy Policy** : cohérente entre la version React in-app et les fichiers HTML statiques. Date de mise à jour : 15 mars 2026.

---

## Problemes détectés

### 1. Lien privacy obsolète dans WelcomePage
`src/pages/WelcomePage.tsx` (ligne 103) pointe vers `https://mrbender7.github.io/privacy-policy-radiosphere/` — un ancien lien GitHub Pages. Il devrait pointer vers `https://radiosphere.be/privacy-policy.html`.

### 2. Footer importé mais jamais utilisé
`src/pages/Index.tsx` (ligne 12) : `import { Footer }` est importé mais `<Footer />` n'est rendu nulle part dans le JSX. Code mort.

### 3. Boutons CTA "Bientôt disponible" avec `window.open("#")`
Deux endroits ouvrent un nouvel onglet vers `#` (lien vide) :
- `src/pages/HomePage.tsx` ligne 151 : section "Radio Sphere sur Android"
- `src/components/OnboardingBanner.tsx` ligne 66 : bouton "Bientôt disponible sur Google Play"

Cela ouvre un onglet vide. Il faudrait soit supprimer le `window.open`, soit désactiver le bouton, soit pointer vers un vrai lien quand il sera disponible.

### 4. Textes hardcodés (non traduits)
- `HomePage.tsx` : "Radio Sphere sur Android", "Écoutez vos stations préférées partout…", "Bientôt disponible" — en dur en français, non traduits.
- `NotFound.tsx` : "Oops! Page not found", "Return to Home" — en anglais, non traduit.
- `AboutPage.tsx` / `DesktopSidebar.tsx` / `Footer.tsx` : "Powered by the amazing Radio Browser. Special thanks to Alex Segler…" — en anglais hardcodé.
- `DesktopSidebar.tsx` ligne 107 : lien privacy pointe vers `https://radiosphere.be/privacy-policy.html` (OK pour desktop, mais incohérent avec le comportement mobile qui utilise la page React in-app).

### 5. OnboardingBanner : bouton CTA Google Play
Le bandeau a un bouton "Google Play" qui ouvre `#`. Si l'app n'est pas encore sur le Play Store, ce bouton est trompeur.

---

## Corrections proposées

| # | Fichier | Correction |
|---|---------|------------|
| 1 | `WelcomePage.tsx` | Changer le lien privacy vers `https://radiosphere.be/privacy-policy.html` |
| 2 | `Index.tsx` | Supprimer l'import inutilisé de `Footer` |
| 3 | `HomePage.tsx` | Remplacer `window.open("#")` par un simple `toast` "Bientôt disponible" ou désactiver le bouton |
| 4 | `OnboardingBanner.tsx` | Même chose : remplacer `window.open("#")` par un toast ou désactiver |
| 5 | `NotFound.tsx` | Traduire via `useTranslation()` + ajouter les clés i18n |
| 6 | `HomePage.tsx` | Traduire les textes hardcodés de la section CTA Android |

---

## Suggestions d'amélioration pour la suite

1. **Traduire tous les textes hardcodés restants** — "Powered by Radio Browser…", section CTA Android sur Home, page 404. Garantit une expérience cohérente en 5 langues.

2. **Utiliser le composant Footer** — Il est codé mais inutilisé. L'intégrer en bas de la page desktop (visible sous le contenu scrollable) ou le supprimer pour nettoyer le code.

3. **PWA / Service Worker** — Le projet a des icônes (android-chrome, apple-touch-icon) mais pas de `manifest.json` ni de service worker. Ajouter un manifest PWA permettrait l'installation sur mobile sans le Play Store.

4. **Accessibilité (a11y)** — Ajouter des `aria-label` sur les boutons play/pause/favori des `StationCard`, et des rôles ARIA sur les sections de navigation. Le contraste des textes `text-muted-foreground` mériterait un audit WCAG.

5. **Lazy loading des pages** — `SearchPage`, `LibraryPage`, `AboutPage` pourraient être chargées en `React.lazy()` pour réduire le bundle initial.

6. **Gestion d'erreur globale** — Ajouter un `ErrorBoundary` React pour capturer les crashes et afficher un fallback plutôt qu'un écran blanc.

7. **Tests** — Seul `example.test.ts` existe. Ajouter des tests unitaires pour les hooks critiques (`useFavorites`, `useCast`) et des tests d'intégration pour le flux de lecture.


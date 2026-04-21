

## Plan : ajouter une section « Paramètres » avec sa propre page

### Objectif
Créer un nouvel onglet **« Paramètres »** (icône engrenage) dans la sidebar desktop, qui ouvre une nouvelle page dédiée. On y déplace les sections **Langue**, **Minuterie de sommeil**, **Gérer les favoris** et **Mode d'emploi** depuis la page « À propos ». La page « À propos » conserve uniquement les contenus informatifs (TimeBack Machine, Radio Browser, Analytics, Politique de confidentialité, lien revoir bienvenue, reset, copyright, réseaux sociaux). Les deux pages partagent le même footer (copyright + Radio Browser + réseaux sociaux).

### Comportement
- **Sidebar desktop étendue** : nouvel item « Paramètres » avec icône engrenage (`Settings` de lucide). L'icône « ⓘ » (À propos) reste affichée. Ordre proposé : Accueil, Explorer, Favoris, **Paramètres**, À propos.
- **Sidebar desktop réduite** : uniquement l'icône engrenage à la même position, l'icône d'exclamation/info de « À propos » reste également présente.
- **Mobile (BottomNav)** : on garde 4 onglets (limite d'espace). L'onglet « À propos » devient « Paramètres » (icône engrenage), et la page « Paramètres » contient un lien clair en haut « En savoir plus sur RadioSphere.be » pointant vers la page À propos. *Alternative validée par défaut : conserver les 4 onglets actuels sur mobile et exposer la page Paramètres via un lien proéminent en haut de la page À propos. Je retiens cette option pour ne pas casser l'UX mobile.*

### Changements techniques

1. **Nouvelle page `src/pages/SettingsPage.tsx`**
   - Reprend depuis `AboutPage.tsx` : bloc Langue, `CollapsibleSection` Sleep Timer, `CollapsibleSection` Favorites management (avec dialog stations indisponibles), `<UserGuideModal />`.
   - Footer commun (copyright + Radio Browser + 3 icônes Facebook/Instagram/Bluesky) factorisé.
   - Header : icône `Settings` + titre `t("nav.settings")`.

2. **Factorisation du footer** : créer `src/components/AboutFooter.tsx` (copyright + powered by + social links) pour éviter la duplication entre `AboutPage` et `SettingsPage`.

3. **Mise à jour `src/pages/AboutPage.tsx`**
   - Supprimer les blocs : Langue, Sleep Timer, Favorites management, UserGuideModal.
   - Conserver : OnboardingBanner, TimeBack Machine, Radio Browser, Analytics, lien Politique de confidentialité, lien Revoir bienvenue, Reset app, footer (via `<AboutFooter />`).
   - Ajouter en haut un lien rapide vers Paramètres (mobile UX).

4. **Mise à jour `src/components/BottomNav.tsx`** et **`src/components/DesktopSidebar.tsx`**
   - `TabId` ajout `"settings"`.
   - DesktopSidebar : ajouter `{ id: "settings", labelKey: "nav.settings", icon: Settings }` entre Favoris et À propos. En mode collapsed, l'icône reste visible (logique existante des `navItems` la gère déjà).
   - BottomNav : conserver 4 onglets (Home/Explore/Favorites/About). Pas de changement visuel pour ne pas écraser l'existant.

5. **Mise à jour `src/pages/Index.tsx`**
   - `ROUTE_TO_TAB` / `TAB_TO_ROUTE` : ajouter `settings: "/settings"`.
   - `PAGE_META` : ajouter une entrée SEO `settings` (titre + description traduits par défaut FR).
   - `renderContent` : ajouter `case "settings": return <SettingsPage onReopenWelcome={…} />;`
   - Lazy-load de `SettingsPage` comme les autres pages.

6. **Mise à jour `src/routes.tsx`**
   - Ajouter `{ path: "settings", Component: () => null }` dans les enfants.
   - Ajouter `/settings` à `includedRoutes` pour le SSG.

7. **Traductions `src/i18n/translations.ts`**
   - La clé `nav.settings` existe **déjà** dans les 14 langues (vérifié). Aucun ajout requis pour le label de navigation.
   - Ajouter dans chaque langue : `settings.pageTitle` (= titre de la page Paramètres) et `settings.pageSubtitle` (court descriptif). Les autres libellés (langue, sleep timer, favoris…) sont déjà traduits.

### Résultat attendu
- Sidebar desktop : 5 entrées avec engrenage clair pour Paramètres, ⓘ pour À propos. Les deux restent visibles en mode réduit.
- Page **Paramètres** : tous les contrôles utilisateurs (langue, minuterie, favoris CSV, guide).
- Page **À propos** : informations sur l'app, vie privée, sources, footer identique.
- Footer (copyright + Radio Browser + réseaux sociaux) identique sur les deux pages via composant partagé.
- Navigation mobile inchangée pour préserver l'UX 4-onglets.
- Pas de cookies, traductions complètes, SSG mis à jour.


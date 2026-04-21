

## Plan : transformer la page de bienvenue en modale

### Objectif

Remplacer la **page de bienvenue plein écran** par une **modale** qui s'ouvre uniquement :
1. Au tout premier démarrage (pas de flag `radiosphere_onboarded` dans le localStorage)
2. Quand l'utilisateur clique sur « Revoir la page de bienvenue » dans les Réglages

La page d'accueil (`HomePage`) devient ainsi la **vraie première page visible** — le visiteur voit immédiatement le contenu (suggestions locales, genres, recherche), avec la modale superposée par-dessus si nécessaire. Bénéfices : meilleure UX, meilleur SEO (contenu visible dès le premier paint), pas de friction si l'utilisateur veut juste fermer la modale.

### Comportement de la modale

- S'ouvre par-dessus la page d'accueil (overlay sombre + dialog centré)
- Conserve **tout le contenu actuel** de `WelcomePage` : logo glow, titre, sous-titre, badge Google Play, grille des 4 features, sélecteur de langue, bouton « Commencer », réseaux sociaux, lien politique de confidentialité
- Boutons de fermeture :
  - Le bouton **« Commencer »** : enregistre la langue choisie + écrit `radiosphere_onboarded=true` + ferme la modale
  - Une **croix de fermeture (×)** en haut à droite : ferme la modale **et** marque l'onboarding comme terminé (pour ne pas la rouvrir au prochain visite)
  - Clic en dehors / touche Échap : même comportement que la croix
- **Aucun cookie** — uniquement `localStorage` (clé existante `radiosphere_onboarded`)

### Changements techniques

1. **Créer `src/components/WelcomeModal.tsx`** — nouveau composant basé sur `Dialog` (`@/components/ui/dialog`) avec une `DialogContent` large (max-w-md, scrollable sur mobile). Reprend intégralement le JSX actuel de `WelcomePage` (logo + glows, sélecteur de langue, features, badge Play, socials, lien privacy). Props : `open`, `onOpenChange(open)`, `onComplete(lang)`. Applique aussi la direction RTL au `documentElement` quand l'arabe est sélectionné, comme aujourd'hui.

2. **Modifier `src/pages/Index.tsx`** :
   - Supprimer l'import de `WelcomePage` et le rendu conditionnel `if (showWelcome) return <WelcomePage … />`
   - Toujours rendre la page principale (`HomePage` etc.)
   - Monter `<WelcomeModal open={showWelcome} onOpenChange={…} onComplete={handleWelcomeComplete} />` à côté du `FullScreenPlayer`
   - Quand la modale est fermée via la croix/Échap : marquer aussi `radiosphere_onboarded=true` (réutilise la logique de `handleWelcomeComplete` sans changer la langue si rien n'est sélectionné)
   - `handleReopenWelcome` continue d'ouvrir la modale (`setShowWelcome(true)`) — fonctionne déjà avec le bouton « Revoir la page de bienvenue » dans `AboutPage` et dans le `UserGuideModal`

3. **Supprimer `src/pages/WelcomePage.tsx`** — plus utilisé après la migration. Aucune autre référence dans le code (vérifié : seul `Index.tsx` l'importe).

4. **Pas de changement** sur :
   - La clé `localStorage` (`radiosphere_onboarded`) — comportement identique
   - Les traductions — toutes les clés `welcome.*` restent utilisées par la modale
   - Le SSG — `hasCompletedOnboarding()` retourne `true` en SSR, donc la modale n'apparaît jamais dans le HTML pré-rendu (bon pour le SEO)
   - `AboutPage` et `UserGuideModal` — les props `onReopenWelcome` existent déjà

### Résultat attendu

- **Premier visiteur** : voit la HomePage en arrière-plan + la modale de bienvenue par-dessus → peut choisir sa langue et commencer, OU fermer la modale et explorer directement
- **Visiteur récurrent** : voit directement la HomePage, sans aucune interruption
- **Depuis les Réglages** : clic sur « Revoir la page de bienvenue » → la modale réapparaît par-dessus la page courante
- Aucun cookie ajouté, uniquement `localStorage`
- Aucun changement visuel sur la HomePage elle-même


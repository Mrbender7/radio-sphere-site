## Diagnostic rapide

Le symptôme “visites Facebook de 1 seconde” correspond très probablement à un écran d’erreur/cache affiché au chargement ou à un blocage JavaScript avant interaction.

J’ai identifié plusieurs points encore risqués pour les WebViews Facebook/Instagram :

1. **Le Service Worker peut encore casser les visiteurs qui avaient déjà un cache corrompu** : on le désactive dans l’app React, mais si le bundle React ne démarre pas, le visiteur peut rester bloqué avant que le nettoyage ne s’exécute.
2. **L’écran d’erreur actuel demande encore “Clear cache & reload”** : c’est utile pour nous, mais mauvais pour un visiteur Facebook qui part immédiatement.
3. **`localStorage.setItem(...)` non protégé dans certains hooks** peut faire tomber l’app dans une WebView restrictive : favoris, récents, onboarding banner, découvertes, quota TBM.
4. **Chromecast SDK est chargé pour tout le monde dès `index.html`**. Dans les WebViews Facebook, c’est inutile et peut ajouter des erreurs/latences au tout premier chargement.
5. **`navigator.mediaSession` et `new Audio()` restent partiellement non protégés** dans `PlayerContext`, donc certaines WebViews peuvent encore déclencher un crash au démarrage ou à la première lecture.

## Plan de correction

### 1. Nettoyage cache/Service Worker avant React
Ajouter dans `index.html` un petit script inline exécuté très tôt :
- détecter les WebViews Facebook/Instagram/TikTok/etc. via user-agent ;
- unregister les Service Workers existants ;
- vider les caches applicatifs ;
- poser un flag mémoire pour éviter une boucle ;
- continuer le chargement normalement.

Objectif : même si le cache précédent est corrompu, le visiteur Facebook n’atterrit plus sur un écran demandant de vider le cache.

### 2. Ne plus charger Chromecast dans les WebViews
Modifier `index.html` pour ne charger `cast_sender.js` que hors WebView in-app.

Dans `useCast.ts`, ajouter aussi un court-circuit : si WebView détectée, passer directement en mode fallback/unavailable sans tenter d’initialiser le Cast SDK.

Objectif : réduire les scripts tiers inutiles et les risques de crash sur Facebook WebView.

### 3. Remplacer l’écran d’erreur par une récupération automatique silencieuse
Modifier `ErrorBoundary.tsx` et `routes.tsx` :
- en WebView : tenter automatiquement “clear caches + hard reload” une seule fois ;
- si l’erreur persiste : afficher un message simple en français/anglais avec deux actions visibles : “Recharger” et “Ouvrir dans le navigateur” / “Copier le lien”, au lieu de “Clear cache & reload” ;
- garder le bouton technique “Clear cache” uniquement hors WebView si nécessaire.

Objectif : ne plus faire fuir les visiteurs avec un message technique.

### 4. Sécuriser tous les accès storage restants
Créer/utiliser des helpers sûrs dans `src/utils/inAppBrowser.ts` ou un petit `safeStorage.ts` :
- `safeGetItem`, `safeSetItem`, `safeRemoveItem`, `safeClearStorage` ;
- remplacer les `localStorage.setItem/removeItem/clear` non protégés dans :
  - `useFavorites.ts`
  - `useWeeklyDiscoveries.ts`
  - `useTBMQuota.ts`
  - `OnboardingBanner.tsx`
  - reset app dans `Index.tsx`

Objectif : aucune restriction storage Facebook ne doit pouvoir crasher l’app.

### 5. Durcir `PlayerContext` et le préchargement audio
- Wrapper la création de `globalAudio` dans `try/catch`.
- Créer des helpers sûrs pour `mediaSession.playbackState`, `metadata`, `setActionHandler`.
- Wrapper les appels `audio.load()`, `audio.pause()`, `audio.src = ...` les plus sensibles.
- Dans `useStreamPrefetch.ts`, désactiver le prefetch dans les WebViews in-app et wrapper `new Audio()`.

Objectif : éviter les crashes liés à audio/media APIs dans les navigateurs intégrés.

### 6. Adapter le bandeau WebView pour rassurer plutôt que faire peur
Conserver le bandeau, mais rendre le message plus clair :
- “Vous êtes dans le navigateur intégré Facebook. Si la lecture ne démarre pas, ouvrez dans Chrome/Safari.”
- garder “Ouvrir dans le navigateur” et “Copier le lien”.
- traduire aussi “Copy link” au lieu du texte hardcodé actuel.

Objectif : proposer une sortie sans bloquer la navigation ni donner l’impression que le site est cassé.

### 7. Ajouter une télémétrie minimale des crashes WebView
Utiliser Umami si disponible pour tracer :
- `webview-detected`
- `webview-cache-purge-attempted`
- `webview-error-boundary`
- `webview-open-external`
- `webview-copy-link`

Objectif : confirmer ensuite si les visites Facebook dépassent enfin 1 seconde et si des erreurs persistent.

## Vérifications prévues

Après implémentation :
- lancer le build TypeScript/Vite ;
- vérifier qu’il n’y a plus d’accès storage non protégé dans les fichiers critiques ;
- vérifier que le Service Worker reste actif hors WebView mais est neutralisé en WebView ;
- vérifier que le flux normal navigateur desktop/mobile reste inchangé.

## Résultat attendu

Les visiteurs venant de `l.facebook.com` / `lm.facebook.com` ne devraient plus voir l’écran “vider le cache et reloader”. Si Facebook WebView reste limitée, ils verront au pire un bandeau clair avec une action simple pour ouvrir dans Chrome/Safari, tout en pouvant naviguer dans l’app.
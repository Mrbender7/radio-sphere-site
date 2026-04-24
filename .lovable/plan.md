# Audit WebView (Facebook / Instagram / TikTok…) — corrections navigation

## Diagnostic

Après lecture du code, j'ai identifié **plusieurs causes cumulées** qui empêchent la navigation dans les WebViews intégrés (Facebook en priorité). Les onglets (Accueil, Explorer, Favoris, etc.) ne réagissent pas aux clics, ou la page semble figée.

### Cause #1 — Piège `history.pushState` dans `useBackButton`
Dans `src/hooks/useBackButton.ts`, le fallback web (utilisé quand `@capacitor/app` n'est pas natif) :
1. Pousse une entrée bidon dans l'historique au montage : `window.history.pushState(null, "", window.location.href)`.
2. À chaque `popstate`, **repousse** une nouvelle entrée. Résultat : l'utilisateur est piégé sur la page courante.

Or, **`@capacitor/app` est installé comme dépendance npm** (`package.json`), donc `await import('@capacitor/app')` **réussit silencieusement** dans le WebView Facebook (le module se charge, mais `App.addListener('backButton', …)` ne reçoit jamais d'évènement car ce n'est pas un environnement natif Capacitor). Conséquence : ni le natif ne fonctionne, ni le fallback popstate ne s'active. Le bouton retour du WebView est inopérant et, plus grave, certains WebViews interprètent la combinaison « pushState + listener mort » comme une page bloquante.

### Cause #2 — Détection d'environnement Capacitor erronée
Le code suppose qu'on est en natif dès que `@capacitor/app` peut être importé. Il faut explicitement tester `window.Capacitor?.isNativePlatform()` (ce que fait déjà `RadioAutoPlugin.ts`) avant d'utiliser l'API native.

### Cause #3 — `WelcomeModal` bloquante au premier lancement
Dans le WebView Facebook, `localStorage` peut être :
- partitionné (chaque ouverture crée un nouveau stockage),
- carrément désactivé (mode privé / restrictions ITP).

Donc `hasCompletedOnboarding()` renvoie toujours `false` → la `WelcomeModal` s'ouvre à chaque chargement. Or cette modale (Radix Dialog) pose un overlay plein écran avec `pointer-events: auto` qui **bloque tous les clics** sous-jacents tant qu'elle n'est pas explicitement fermée. Si le « Continue » échoue (parce que `setLanguage` essaie d'écrire dans localStorage qui throw), la modale ne se ferme jamais → app figée.

### Cause #4 — `InAppBrowserBanner` correctement détecté mais sans véritable solution
Le bandeau s'affiche bien (regex couvre FBAN/FBAV/Instagram/etc.) mais propose `window.open(url, "_blank")` qui, dans un WebView Facebook, **est bloqué** ou ouvre dans la même WebView (no-op). Il faut proposer le « copier le lien » et ouvrir via `intent://` / `x-safari-https://` quand possible.

### Cause #5 — Service Worker dans un WebView
`registerSW` est appelé même dans Facebook WebView. Sur certains WebViews, l'enregistrement échoue silencieusement, sur d'autres il met en cache des chunks qui plantent ensuite. Il faut **désactiver le SW dans les WebViews détectés**.

### Cause #6 — `WakeLock` / `MediaSession` non gardés
Plusieurs `navigator.wakeLock.request` et `navigator.mediaSession.setActionHandler` sont appelés sans try/catch suffisant. Un throw non géré dans un `useEffect` peut casser le rendu React entier dans certains WebViews stricts.

---

## Plan de corrections

### 1. Réécrire `src/hooks/useBackButton.ts`
- Ajouter un helper `isCapacitorNative()` qui retourne `window.Capacitor?.isNativePlatform() === true`.
- Si **pas natif** → ne **jamais** importer `@capacitor/app`, ne **jamais** pousser dans `history`. Se contenter d'écouter `popstate` passivement (sans re-push).
- Si natif → garder le comportement actuel.
- Résultat : la nav fonctionne normalement dans tous les navigateurs (y compris WebViews), et le double-tap pour quitter reste une fonctionnalité native uniquement.

### 2. Robustifier `src/pages/Index.tsx` — onboarding non-bloquant
- Si `localStorage` est inaccessible (try/catch échoue), considérer l'onboarding comme **complété par défaut** dans les WebViews détectés, pour éviter d'ouvrir la modale à chaque chargement.
- Ajouter une garde : si la modale est ouverte mais que `localStorage` ne fonctionne pas, montrer un bouton « Continuer » qui se contente de fermer la modale en mémoire (sans persistance).
- Détecter le WebView via le même utilitaire que `InAppBrowserBanner` (extrait dans un fichier partagé `src/utils/inAppBrowser.ts`).

### 3. Améliorer `src/components/InAppBrowserBanner.tsx`
- Extraire la détection dans `src/utils/inAppBrowser.ts` (réutilisable).
- Ajouter trois actions : **Copier le lien** (clipboard), **Ouvrir dans Chrome** (Android via `intent://…#Intent;end`), **Ouvrir dans Safari** (iOS via `x-safari-https://`).
- Rendre le bandeau plus visible (icône d'avertissement, fond ambre/rouge) pour inciter à sortir du WebView.
- Ne plus auto-cacher si l'utilisateur clique « Plus tard » : juste replier le bandeau en une petite pastille flottante.

### 4. Désactiver le Service Worker dans les WebViews — `src/main.tsx`
- Avant `registerSW`, vérifier `isInAppBrowser()` → si oui, **skip** l'enregistrement et purger toutes les caches existantes (`caches.keys()` puis `delete`).
- Évite les chunks corrompus en cache et les boucles JSON.parse déjà gérées.

### 5. Garder les API « pointues » sous try/catch dans `PlayerContext`
- Wrapper `navigator.mediaSession.setActionHandler` dans des try/catch individuels (déjà partiellement fait, à compléter).
- Idem pour `wakeLock.request` (déjà fait) et la création de `silentAudio` (la lecture de `data:audio/wav` peut throw dans certains WebViews stricts → wrapper dans try/catch).

### 6. CSP — autoriser `blob:` pour les workers (si Vite split en dynamique)
- Vérifier au build si Vite produit des workers `blob:`. Si oui, ajouter `worker-src 'self' blob:` dans la `Content-Security-Policy` de `index.html` et de `public/_headers`.
- Sinon, laisser tel quel.

### 7. Tester / valider
- Lancer `npm run build` pour s'assurer qu'aucune régression TypeScript.
- Documenter dans `mem://` une nouvelle entrée `tech/webview-compat` listant les bonnes pratiques (jamais `pushState` au mount, jamais `localStorage` sans fallback, SW désactivé dans WebView).

---

## Fichiers touchés

| Fichier | Changement |
|---|---|
| `src/hooks/useBackButton.ts` | Réécriture : détection Capacitor stricte, popstate passif |
| `src/utils/inAppBrowser.ts` (nouveau) | Helpers `isInAppBrowser()`, `openInExternalBrowser(url)` |
| `src/components/InAppBrowserBanner.tsx` | Utilise les helpers, propose copy + intent + safari |
| `src/pages/Index.tsx` | Onboarding non-bloquant si localStorage KO |
| `src/main.tsx` | Skip SW + purge cache dans WebView |
| `src/contexts/PlayerContext.tsx` | Try/catch supplémentaires (silentAudio, mediaSession) |
| `index.html` + `public/_headers` | Ajout `worker-src` si nécessaire |
| `mem://tech/webview-compat.md` (nouveau) | Documentation des règles |

## Notes techniques (lecture optionnelle)

- **Pourquoi `@capacitor/app` se charge dans Facebook WebView ?** Vite bundle le module dans le chunk principal ou en dynamique. L'import dynamique réussit côté JS (le code est là), mais l'API `App.addListener` est en réalité un **proxy** qui appelle le bridge natif `Capacitor.toNative()` — qui n'existe pas hors app native, donc l'appel est silencieusement ignoré.
- **Pourquoi `window.history.pushState` casse ?** Dans Facebook WebView, le bouton retour du WebView (la flèche en haut à gauche) déclenche `history.back()`. Si le seul historique est l'entrée bidon poussée par nous, l'utilisateur est piégé jusqu'à fermer la WebView entière.
- **Pourquoi pas de session replay ?** Les WebViews bloquent souvent les iframes externes (`umami`, `replay`), donc on n'a pas de logs côté plateforme. La détection se fait à 100% via UA.

Aucune dépendance npm supplémentaire requise. Tout est en JS pur natif.
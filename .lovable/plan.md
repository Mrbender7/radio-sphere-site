

## Plan : Robustesse dans les navigateurs in-app (Facebook, Instagram, etc.)

### Diagnostic

L'écran "Unexpected Application Error! Unexpected token '<', '<!DOCTYPE'..." vient de **react-router-dom** : une erreur non capturée se propage jusqu'au routeur, qui affiche son propre écran d'erreur (qui contourne notre `ErrorBoundary` React).

**Cause racine** : dans le navigateur in-app de Facebook (et parfois Firefox mobile au premier essai), les requêtes externes vers `raw.githubusercontent.com` (fallback stations.json) ou `api.radio-browser.info` peuvent renvoyer une **page HTML** (avertissement WebView, captive portal, blocage proxy) au lieu de JSON. Le `await res.json()` plante alors avec exactement le message visible sur la capture.

`src/services/radio/fallback.ts` (ligne 56) appelle `await res.json()` **sans valider le content-type** — contrairement à `mirrors.ts` qui le fait déjà bien. Et au-dessus, certains chargements de page (dans `HomePage`, `useWeeklyDiscoveries`, etc.) lancent ces fetchs au montage : si tout échoue, la promesse rejetée remonte.

### Corrections

**1. Sécuriser `fallback.ts`** (cause directe du message d'erreur)
- Remplacer `await res.json()` par la même logique de garde que `mirrors.ts` : vérifier content-type, détecter les pages HTML (`<!`, `<html`), lever une erreur claire au lieu de laisser exploser le parser JSON.

**2. Ajouter une `errorElement` au router**
- Dans `src/routes.tsx`, attacher un `errorElement` à la route racine qui réutilise notre `ErrorBoundary` visuel (logo + bouton recharger). Cela remplace l'écran brut de react-router par notre UI cohérente, peu importe d'où vient l'erreur.

**3. Capture globale des promesses rejetées**
- Dans `src/main.tsx`, ajouter un listener `window.addEventListener("unhandledrejection", ...)` qui log proprement et empêche les crashs silencieux. Utile pour les `fetch` lancés en arrière-plan.

**4. Détection navigateur in-app + bandeau d'aide (optionnel mais recommandé)**
- Détecter via `navigator.userAgent` les WebViews connues : `FBAN`, `FBAV` (Facebook), `Instagram`, `Line`, `MicroMessenger` (WeChat), `Twitter`.
- Si détecté, afficher un petit bandeau discret en haut : "Pour une meilleure expérience, ouvrez radiosphere.be dans votre navigateur." avec bouton "Ouvrir dans le navigateur" (qui tente `window.open` ou copie le lien).
- Texte traduit dans les 14 langues.

**5. Retry doux côté hooks de chargement**
- Dans `useWeeklyDiscoveries` et autres hooks qui fetchent au montage : envelopper dans try/catch silencieux qui ne propage pas l'erreur (l'app reste utilisable même si la liste est vide).

### Fichiers modifiés

- `src/services/radio/fallback.ts` — validation content-type avant `.json()`
- `src/routes.tsx` — ajout `errorElement` réutilisant `ErrorBoundary`
- `src/main.tsx` — listener `unhandledrejection`
- `src/components/InAppBrowserBanner.tsx` — nouveau composant de détection
- `src/pages/Index.tsx` — montage du bandeau
- `src/i18n/translations.ts` — clés `inAppBrowser.warning` et `inAppBrowser.openExternal` (14 langues)
- `src/hooks/useWeeklyDiscoveries.ts` — try/catch défensif

### Hors périmètre

- Pas de proxy server-side (le projet est statique, pas de backend disponible).
- Pas de service worker offline pour les données API (déjà couvert par cache PWA mais limité dans WebView Facebook qui isole le SW).


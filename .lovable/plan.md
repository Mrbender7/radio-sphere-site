

## Plan : éliminer les crashes JSON.parse dans les WebViews et navigateurs mobiles

### Diagnostic

L'écran "**Unexpected Application Error! JSON.parse: unexpected character at line 1 column 1**" est un écran d'erreur **react-router**, pas notre `ErrorBoundary` visuel. Il signale qu'une erreur a échappé à toutes les protections. Vu la corrélation (chute du temps de visite Firefox/WebView de 2 min à 8 sec), c'est probablement récurrent et silencieux.

**4 sources résiduelles identifiées qui peuvent toujours crasher** :

1. **`src/services/radio/mirrors.ts:63`** — `await res.json()` est appelé directement quand le content-type contient `application/json`. **Mais** un Service Worker Workbox (cache `api-cache` configuré dans `vite.config.ts`) peut servir une réponse cachée corrompue où le header dit "json" mais le body est tronqué/HTML. Aucun try/catch autour de ce `.json()`.

2. **`src/services/radio/fallback.ts:71`** — même problème : `await res.json()` direct sur la branche "content-type OK", sans try/catch.

3. **`reportStationClick` dans `RadioService.ts:53`** — `await fetch(...)` sans `.json()`, donc OK, mais lance une requête à chaque play. Si le mirror est mort, l'erreur réseau remonte (atténuée par try/catch englobant ✓).

4. **Workbox cache empoisonné** — `NetworkFirst` avec `networkTimeoutSeconds: 5` peut cacher une réponse 503 Cloudflare avec body HTML mais headers JSON. La prochaine navigation Accueil → À propos déclenche un `useQuery` qui hit le cache → crash.

5. **`errorElement` du router** — dans `routes.tsx`, le `RouteErrorFallback` appelle `<ThrowToFallback />` qui re-throw immédiatement *à l'intérieur* de l'`ErrorBoundary`. Mais react-router a déjà capturé l'erreur originale **avant** d'afficher l'errorElement → le re-throw est capturé par notre boundary et fonctionne. **Sauf** : si l'erreur survient dans un **lazy chunk** (ex: chargement de `AboutPage.tsx`), react-router peut afficher son écran natif avant que l'errorElement ne prenne le relais selon la version.

### Corrections proposées

**1. Bétonner `mirrors.ts` (priorité 1)**
- Wrapper le `await res.json()` final dans un try/catch qui re-tente via `res.text()` + `JSON.parse` avec garde HTML, identique à la branche "content-type inattendu".
- Bénéfice : neutralise les caches Workbox empoisonnés.

**2. Bétonner `fallback.ts` (priorité 1)**
- Même traitement que `mirrors.ts` : try/catch autour du `.json()` final, fallback texte + détection HTML.

**3. Purger le cache Workbox API au boot si corrompu**
- Dans `main.tsx`, après l'enregistrement du SW, ajouter une routine qui supprime `caches.delete('api-cache')` si on détecte qu'un précédent crash JSON.parse a eu lieu (flag dans `sessionStorage`).
- Capturer dans le `unhandledrejection` listener les erreurs contenant "JSON.parse" / "Unexpected token" → marquer le flag → au prochain reload, purger.

**4. Réduire le risque cache empoisonné côté Workbox**
- Dans `vite.config.ts`, sur le `runtimeCaching` de l'API, ajouter `cacheableResponse: { statuses: [200] }` pour ne **jamais** mettre en cache les réponses non-200 (Cloudflare 503, captive portal 200-mais-HTML resteront mais c'est déjà rare).
- Réduire `maxAgeSeconds` de 1h à 5 min pour cette entrée — un cache empoisonné s'auto-nettoie vite.

**5. Améliorer l'errorElement du router**
- Remplacer le hack `ThrowToFallback` par un composant qui rend directement le visuel d'erreur (logo + bouton recharger), sans passer par un re-throw dans `ErrorBoundary`. Cela évite tout risque de cycle si l'`ErrorBoundary` lui-même rencontrait un problème.
- Ajouter un bouton "Vider le cache et recharger" qui appelle `caches.keys().then(keys => keys.forEach(k => caches.delete(k)))` puis `unregister()` du SW avant `location.reload()`.

**6. Capturer aussi `window.error` (pas que `unhandledrejection`)**
- Dans `main.tsx`, ajouter `window.addEventListener("error", ...)` pour les erreurs synchrones non capturées (ex: erreur dans un setTimeout interne d'une lib).

**7. Logging diagnostic léger via Umami**
- Quand `unhandledrejection` capte une erreur JSON.parse, envoyer un event Umami `js-crash` avec le message et la route active. Permettra de mesurer si la correction fonctionne.

### Détails techniques

| Fichier | Modification |
|---|---|
| `src/services/radio/mirrors.ts` | Refactor `fetchJsonArray` : toujours passer par `res.text()` + parse manuel avec garde HTML, supprimer la branche `res.json()` directe |
| `src/services/radio/fallback.ts` | Idem : unifier le parsing JSON via `res.text()` |
| `src/main.tsx` | Listener `error` + `unhandledrejection` enrichi : détecte "JSON.parse" / "Unexpected token", set flag `sessionStorage`, purge `api-cache` au prochain boot |
| `vite.config.ts` | Ajouter `cacheableResponse: { statuses: [200] }` et baisser `maxAgeSeconds` à `300` sur l'entrée `api-cache` |
| `src/routes.tsx` | Remplacer `RouteErrorFallback` par un composant direct (pas de re-throw), avec bouton "Vider le cache" |
| `src/components/ErrorBoundary.tsx` | Ajouter bouton "Vider le cache et recharger" en plus du bouton actuel |

### Hors périmètre

- Pas de Sentry / monitoring tiers (objectif privacy).
- Pas de bypass du Service Worker — on le garde pour la PWA, on le rend juste plus robuste.
- Pas de modification de l'API Radio Browser (côté serveur, on n'y touche pas).

### Résultat attendu

- Plus aucun écran "Unexpected Application Error" affiché à l'utilisateur, quelle que soit la qualité de la réponse réseau.
- Si un cache est empoisonné, l'app le détecte et se purge automatiquement au reload suivant.
- Les utilisateurs Firefox mobile / WebView verront au pire un fallback visuel propre (logo + bouton recharger), jamais l'écran brut de react-router.


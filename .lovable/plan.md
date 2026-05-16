## Lecture du rapport + avis Gemini/Claude

J'ai croisé le rapport, Gemini et Claude avec l'état actuel du code. Voici ce qui tient et ce qui ne tient pas, avant tout fix.

### Ce que les 3 sources disent et qui est vrai
- 100% des erreurs sur `/`, en cascade #418 → #423 → CSR fallback.
- Médiane CSR fallback à **1816 ms** = flash blanc perçu comme un crash.
- 94 % du trafic en erreur vient du **WebView Facebook** (campagne `120243382723630172`).
- Page Lite : **46 vues, 0 CTA cliqué** — problème UX séparé.

### Ce que Gemini affirme mais qui est déjà fait dans le code
Gemini propose de déplacer la lecture des query params dans un `useEffect`. C'est **déjà le cas** :
- `cleanUrlPollutingParams()` s'exécute en haut de `main.tsx` **avant React** et strippe fbclid/utm_* via `history.replaceState`.
- `trackAdLandingOnce()` est dans un `useEffect([])` dans `Index.tsx`.
- `Index.tsx` initialise `activeTab="home"` / `showPrivacy=false` / `showWelcome=false` à des valeurs stables et synchronise dans un `useEffect`.
- Tout le chrome dynamique (Sidebar, MiniPlayer, WelcomeModal, etc.) est déjà sous `<ClientOnly>`.

Donc le diagnostic "URL lue au render initial" est **probablement faux** ici. Reproduire le bug avec `?fbclid=test` en local ne va sans doute rien donner — c'est ce qu'on a déjà fait.

### Ce que Claude voit juste et que Gemini rate
1. **`__lovable_sha` (35 %) et `forceHideBadge` (29 %) sont au-dessus de `fbclid` (23 %)**. Ces params ne sont **pas** dans notre liste `POLLUTING_PARAMS` (`src/lib/analytics-events.ts`) ni dans `TRACKING_PARAMS` (`src/utils/adLandingTracking.ts`). Ils restent dans l'URL et peuvent biaiser les stats — mais pas casser l'hydratation : aucun composant ne les lit (vérifié par `rg`).
2. **L'erreur `Cannot read properties of undefined (reading 'add')` (8 occurrences) est ignorée par Gemini.** C'est **la vraie cause racine probable** : une exception JS pendant le render initial → React jette le tree → cascade #418/#423 → CSR fallback. Le grep dans `src/` ne montre aucun `.classList.add` direct, donc c'est soit un appel `Set.add` / `Map.set` sur un objet undefined, soit un appel via lib tierce (Cast SDK, react-helmet, vite-react-ssg, Umami pixel, Workbox).
3. **0 % de conversion sur `/lite.html`** = chantier UX séparé à ne pas mélanger.

### Le vrai problème de visibilité
`src/utils/patchHydrateRoot.ts` est un **no-op** depuis une régression SSG ("Cannot assign to read only property 'hydrateRoot'"). Donc `onRecoverableError` n'est branché **que** dans le mount CSR-fallback, pas pendant l'hydratation initiale. Résultat : `hydration-mismatch-detail` arrive vide de `componentStack` et on a juste le message minifié. On vole à l'aveugle.

---

## Plan d'action (3 étapes, indépendantes)

### Étape 1 — Récupérer le `componentStack` pour identifier le composant fautif
Re-brancher `onRecoverableError` sur l'**hydratation initiale** sans casser le build SSG :
- Au lieu de monkey-patcher `ReactDOM.hydrateRoot` (interdit en ESM), passer par la **3ᵉ option de `ViteReactSSG()`** : `hydrationOptions: { onRecoverableError }`. C'est l'API officielle de vite-react-ssg et elle ne touche pas au namespace en lecture seule.
- Le callback appellera `trackHydrationMismatch({ digest, componentStack, message, url })` exactement comme dans le path CSR.

**Résultat attendu** : sous 24 h, l'event `hydration-mismatch-detail` aura un vrai `componentStack` (~500 chars) → on saura quel composant React déclenche la cascade. C'est le pré-requis pour fixer la cause racine sans tâtonner.

### Étape 2 — Compléter la liste des params strippés
Dans `src/lib/analytics-events.ts` (`POLLUTING_PARAMS`) **et** `src/utils/adLandingTracking.ts` (`TRACKING_PARAMS`), ajouter :
- `__lovable_sha`, `forceHideBadge` (params Lovable preview qui ne devraient jamais apparaître en prod mais polluent les stats)
- `_branch_match_id`, `_branch_referrer` (Branch.io / deeplinks)

Effet : URLs canoniques propres, moins de bruit dans Umami sur les params corrélés aux erreurs. Aucun impact fonctionnel (aucun composant ne les lit).

### Étape 3 — Traquer le `Cannot read properties of undefined (reading 'add')`
Enrichir le handler `window.addEventListener('error')` dans `main.tsx` pour qu'**en plus** du `message`/`stack` actuels, on capture pour cette classe d'erreur :
- la **première frame applicative** du stack (pattern `/assets/index-*.js:L:C`),
- le **fichier source** mappé si un sourcemap inline est disponible (sinon juste le chunk hash),
- un flag `tracked_via=app-error` pour le différencier des hydration mismatches.

On l'envoie via un nouvel event Umami **`app-runtime-error`** (payload < 1 KB) avec `{ name, message, frame, route, webview, ua_short }`. Une fois remonté dans le dashboard, on saura sur quelle lib/composant pointer.

---

## Ce que je ne propose **pas** de faire maintenant
- **Pas** de `useEffect` saupoudré à l'aveugle : le code respecte déjà le contrat SSG.
- **Pas** de `suppressHydrationWarning` : ça masque le symptôme sans fixer le bug `.add()`.
- **Pas** de touche à la page Lite : c'est un chantier UX (CTA, copywriting) à traiter à part.
- **Pas** de retry automatique côté `ErrorBoundary` : il existe déjà (`forceCsrAndReload`) avec cap 24h ; le vrai gain est d'éliminer la cause, pas d'augmenter les rescues.

## Reproduction
- En local : `bun run build && bun run preview` puis `/?fbclid=test&__lovable_sha=abc&forceHideBadge=true` — utile mais **insuffisant** (on n'est pas dans le WebView Facebook).
- En vrai : déployer l'étape 1, attendre 6–12 h de campagne, relire le dashboard Umami pour récupérer les `componentStack` réels.

Une fois les composantStack remontés (étape 1), on saura si c'est `helmet-async`, le router, un de nos contextes (PlayerContext, StreamBufferContext) ou un appel Cast SDK, et on fera un correctif chirurgical en suivant.

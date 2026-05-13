# Remise en état RadioSphere.be post-WebView

## Diagnostic — pourquoi autant de `error-boundary` sur Umami

Tu ne te trompes pas : les couches anti-WebView empilées ces dernières semaines se déclenchent **aussi sur les navigateurs sains**, et chacune produit un événement `error-boundary` (parfois suivi d'un reload qui en re-déclenche un). Trois coupables principaux :

### 1. L'auto-recovery de l'ErrorBoundary (le plus violent)
Dans `src/components/ErrorBoundary.tsx`, **toute** première erreur dans **n'importe quel** composant React déclenche :
- envoi `error-boundary` à Umami
- purge des Service Workers + Cache Storage
- `setForceCsr()` (désactive l'hydratation)
- reload avec query `?_rs=timestamp`

Conséquences : une erreur bénigne dans un sous-composant (genre une promesse Cast qui rate, un fetch radio-browser qui timeout pendant le render, etc.) **nuke tout le cache de l'utilisateur** et désactive l'hydratation pour 5 min. Sur desktop avec PWA installée, c'est une cause directe du « peu importe ce que je fais, ça ne marche plus ».

### 2. Le « Universal CSR rescue » dans `main.tsx`
Lignes 272-289 : à la première erreur reconnue comme hydratation (#418/#421/#423/#425), force CSR + reload — **sans distinguer WebView vs Edge desktop normal**. Or des extensions, l'auto-translate Chrome, ou même un repaint mal timé suffisent à déclencher un #418 transitoire que la page survivrait normalement.

### 3. console.error patché globalement
Le wrap de `console.error` (ligne 358) requalifie en hydratation des `console.error` qui contiennent juste « did not match » dans un message tiers (Cast SDK, Umami, etc.) → faux positifs qui retombent dans le rescue universel.

### Effet boule de neige
Auto-recovery → reload → nouveau boot avec force-CSR → si le moindre warning React arrive pendant ce boot, re-error-boundary → nouveau reload. D'où le chiffre « affolant » dans Umami : un seul utilisateur peut générer 10-20 events en quelques secondes.

---

## Plan de remise en état

### Étape 1 — Inventaire des modifs WebView (15 min, lecture seule)
Lister tout ce qui a été ajouté pour les WebViews et classer en 3 catégories :
- **Garder tel quel** : redirection `index.html` → `/lite.html`, CSP, `safeStorage` defensive
- **Restreindre aux WebViews uniquement** : force-CSR, auto-recovery cache purge, `ClientOnly` wrappers
- **Supprimer ou désarmer** : patch console.error global, double try-each-error layer

Fichiers concernés à relire :
`src/main.tsx`, `src/components/ErrorBoundary.tsx`, `src/utils/forceCsr.ts`, `src/utils/inAppBrowser.ts`, `src/utils/patchHydrateRoot.ts`, `src/pages/Index.tsx`, `index.html`, `public/lite.html`, `src/components/ClientOnly.tsx`, `src/components/InAppBrowserBanner.tsx`.

### Étape 2 — Borner l'ErrorBoundary
Dans `ErrorBoundary.tsx` :
- **Ne plus déclencher d'auto-recovery sur desktop** : ne purger les caches + force-CSR **que** si `isInAppBrowser()` est vrai.
- Sur navigateurs normaux : juste afficher l'UI « Reload » et envoyer **un seul** event Umami avec `recovery=manual`.
- Garder la limite « une seule recovery par session » pour les WebViews.

### Étape 3 — Restreindre le rescue CSR universel
Dans `main.tsx` `reportHydrationError()` :
- Ne déclencher `setForceCsr() + reload` **que** si `isInAppBrowser()` OU si le code d'erreur fait partie d'un set strict (#418/#423 confirmés bloquants), pas #421/#425 qui sont souvent transitoires et auto-récupérés par React.
- Ajouter un **plafond global** : max 1 force-CSR par session, **et** par origin (cross-tab via localStorage timestamp), pour casser tout risque de boucle.

### Étape 4 — Désarmer le patch console.error
Soit le supprimer entièrement (les `window.error` + `unhandledrejection` listeners suffisent en pratique), soit le restreindre à des messages contenant **explicitement** `Minified React error #` (et pas juste « did not match »).

### Étape 5 — Vérifier la bascule WebView → /lite.html
Le redirect existe déjà dans `index.html` (lignes 88-100) côté client. Vérifier :
- qu'il s'exécute **avant** tout autre script (déjà OK, premier `<script>` du `<head>`)
- que la regex UA couvre bien tous les cas (Reddit, LinkedIn, Snapchat, etc. — déjà OK)
- que `lite.html` ne contient **aucun** import du bundle React (vérification visuelle rapide)
- ajouter un test manuel : forcer un UA Facebook via DevTools sur preview et confirmer la redirection

### Étape 6 — QA navigateurs cibles
Une fois les étapes 2-4 mergées, valider sur :
- **Desktop Chrome / Edge / Firefox** : `radiosphere.be` doit charger sans force-CSR, sans event `error-boundary`, sans reload spontané
- **Edge PWA installée** : recharger plusieurs fois, vérifier qu'aucune purge cache n'est déclenchée
- **Mobile Chrome / Safari** : navigation normale, pas de bascule lite
- **Facebook in-app (UA spoofé)** : doit basculer immédiatement sur `/lite.html`
- **Edge InPrivate** : doit charger normalement (on s'attend à ce que CSR fallback puisse se déclencher 1× max si vraiment besoin)

### Étape 7 — Surveiller Umami 24-48 h
Après déploiement, observer la chute des events `error-boundary`, `csr-fallback-triggered`, `hydration-error-*`. Cible : division par 10 minimum.

---

## Détails techniques

### Critère « WebView » à utiliser partout
`isInAppBrowser()` existe déjà dans `src/utils/inAppBrowser.ts` — l'importer dans `ErrorBoundary.tsx` (déjà fait) et `main.tsx` (déjà importé), et l'utiliser comme garde **avant** toute action destructive (purge SW, force CSR).

### Plafond global force-CSR
```ts
const FORCE_CSR_COUNT_KEY = "__rsForceCsrCount24h";
// Si > 2 force-CSR en 24h depuis ce navigateur → ne plus jamais le déclencher
// automatiquement, juste afficher l'UI manuelle.
```

### Choses à NE PAS toucher
- `index.html` redirect WebView (fonctionne)
- `public/lite.html` (page autonome)
- `safeStorage.ts` (defensive, ne nuit jamais)
- `ClientOnly` wrappers dans `Index.tsx` (corrects, évitent les vrais mismatches SSG)
- Service Worker registration guard `isPreviewHost()` (correct)

---

## Livrable
3 fichiers édités (`ErrorBoundary.tsx`, `main.tsx`, optionnellement `forceCsr.ts` pour le compteur 24h), zéro régression WebView, et un site qui ne se sabote plus tout seul sur les navigateurs normaux.


# Audit "FB Ads → RadioSphere.be" — Plan d'action

Objectif : qu'AUCUN clic depuis tes 3 reels Facebook (newsfeed, story, reels) n'aboutisse sur une page blanche, une page d'erreur, une modale bloquée, ou un site qui "marche pas". L'utilisateur doit voir la WelcomeModal — qui est en effet ta meilleure carte de visite — dès la première seconde.

## Étape 1 — Cartographier les chemins d'arrivée réels

Un clic depuis une pub FB peut atterrir dans **trois environnements distincts**, chacun avec ses pièges :

| Environnement | Comment ça arrive | Risques connus |
|---|---|---|
| **FB In-App WebView (Android)** | clic direct dans l'app FB / Instagram / Reels | localStorage parfois cassé, SW cache du JSON pourri, `window.open` bloqué, audio HTML5 limité, Cast indispo |
| **FB In-App WebView (iOS)** | idem mais WKWebView | mêmes problèmes + autoplay audio bloqué |
| **Navigateur natif** (Chrome / Safari) | utilisateur a forcé "Ouvrir dans le navigateur" | OK normalement, mais SW peut servir un vieux bundle après deploy |

Chaque pub aura aussi des **paramètres UTM** appendus par Meta (`?fbclid=…&utm_source=fb`) → on doit vérifier qu'ils ne cassent pas le routing.

## Étape 2 — Audit point par point (rien ne sera modifié sans ton aval)

### 2.1 Premier rendu (LCP / "blanc")
- Vérifier que le SSG génère bien un HTML pré-rendu pour `/` (route ciblée par tes ads). Si la page reste blanche 2-3s en attendant React, l'utilisateur FB swipe.
- Vérifier les `<Head>` SEO et `og:image` : c'est ce que FB scrape pour la preview de la pub.
- Vérifier que les polices Google ne bloquent pas le rendu (font-display: swap).

### 2.2 In-App Browser detection & UX
- `isInAppBrowser()` couvre FB / Instagram / TikTok mais **pas** Threads, Messenger Lite, ni le "Mobile Browser" de FB Ads Manager. À élargir.
- Le `InAppBrowserBanner` s'affiche en haut → vérifier qu'il **ne masque pas** le bouton "Continuer" de la WelcomeModal sur petits écrans (375×667).
- Le bouton "Ouvrir dans le navigateur" : tester que l'intent Android et le `x-safari-https://` iOS fonctionnent vraiment depuis FB (certains FB WebViews bloquent les schemes custom).

### 2.3 WelcomeModal — la "carte de visite"
- Vérifier qu'elle s'affiche bien **avant** que l'utilisateur puisse cliquer ailleurs.
- Vérifier le fallback `if (isInAppBrowser() && !isLocalStorageWorking()) return true` dans `hasCompletedOnboarding` : actuellement ça **skip la modale** dans certains WebViews. Mauvais pour ta campagne — la modale est justement ce qu'il faut montrer. À reconsidérer : afficher la modale en mode "session-only" plutôt que la masquer.
- Vérifier le rendu mobile vertical (le format où arrivent 95 % des clics ads) : 360×640, 375×667, 414×896.
- Vérifier que la pub Google Play badge fonctionne aussi depuis FB WebView (Play Store s'ouvre-t-il ?).

### 2.4 Service Worker / cache poisoning
- `main.tsx` purge déjà SW + caches en WebView et en preview ✓
- Vérifier qu'aucun chunk JS lazy (`SearchPage`, `LibraryPage`…) ne casse si chargé après un deploy avec un vieux SW (déjà couvert par `registerType: autoUpdate` + auto-recovery dans `ErrorBoundary`).
- Vérifier que les utilisateurs avec un ancien SW installé (visiteurs récurrents) n'ont pas un cache JSON corrompu qui crash → le `crash_purge_pending` couvre déjà ça ✓

### 2.5 Routing & paramètres
- Vérifier que `/?fbclid=xxx&utm_source=facebook` n'est pas mal géré par le routeur.
- Vérifier que `/` (cible probable de tes pubs) charge `HomePage` sans dépendance externe bloquante (API Radio Browser timeouts, fallback `stations.json`).
- Tester le 404 SPA fallback pour Lovable hosting (déjà OK : `404.html` copié en post-build).

### 2.6 Erreurs runtime "silencieuses"
- `unhandledrejection` est déjà swallowed → bon pour ne pas crasher
- `ErrorBoundary` auto-recovery purge le cache une fois → bon
- **MAIS** : tester que l'auto-recovery ne déclenche pas une boucle de reload dans un FB WebView qui ne persiste pas `sessionStorage` (le flag `radiosphere_auto_recovery_attempted` peut être perdu → reload infini).

### 2.7 Audio / lecture
- Tester qu'au premier clic sur une station, l'audio démarre dans FB WebView Android et iOS.
- Si bloqué (autoplay policy), s'assurer que le message d'erreur est compréhensible et non un crash.

### 2.8 Ouverture externe
- Tester les liens sortants (Google Play, réseaux sociaux dans la sidebar/modale) depuis FB WebView : s'ouvrent-ils dans une nouvelle fenêtre ou restent-ils piégés dans le WebView ?

### 2.9 Analytics / mesure de campagne
- Vérifier que Umami capture bien `utm_source=facebook` et un événement "ad-landing" pour mesurer le taux de bounce par source.
- Recommander d'ajouter le **Facebook Pixel** (ou au minimum un événement Umami `fb-ad-arrival`) pour mesurer la conversion de la campagne.

## Étape 3 — Livrables après l'audit

1. Un rapport synthétique : ✅ ce qui est OK, ⚠️ ce qui est risqué, 🛠 ce qu'il faut corriger.
2. Les corrections prioritaires appliquées (avec ton aval) — typiquement :
   - Étendre la regex `IN_APP_BROWSER_REGEX` (Threads, Messenger, etc.)
   - Forcer l'affichage de la WelcomeModal en WebView (mode session-only)
   - Ajouter un guard contre la boucle d'auto-recovery
   - Ajouter un event Umami `ad-landing` qui logue le `referrer` + UTM
3. Un plan de test manuel à faire toi-même depuis ton téléphone (clic réel sur la pub).

## Détails techniques

- Fichiers principalement concernés (lecture d'abord) : `src/utils/inAppBrowser.ts`, `src/components/WelcomeModal.tsx`, `src/components/InAppBrowserBanner.tsx`, `src/components/ErrorBoundary.tsx`, `src/main.tsx`, `src/pages/Index.tsx`, `vite.config.ts` (workbox).
- Test manuel : utiliser `https://developers.facebook.com/tools/debug/` pour vérifier le scrape FB de la landing page (og:image, og:title).
- Pour reproduire un FB WebView en dev : DevTools → User-Agent custom = `Mozilla/5.0 (Linux; Android 13) … FBAN/FB4A;FBAV/...`.

---

**Note :** le plan ci-dessus est un audit + corrections ciblées. Je ne touche à rien tant que tu n'as pas validé. Si tu veux que je fasse aussi le test "live" (navigation réelle dans la preview avec un UA Facebook simulé), je peux le lancer dès l'implémentation.

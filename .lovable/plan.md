## Diagnostic court

Le signal le plus concret n’est plus seulement `location.pathname` : le navigateur remonte maintenant un warning React explicite `validateDOMNesting`: un `<button>` est rendu dans un autre `<button>` dans `StationCard`. React liste ce cas comme cause directe possible de mismatch d’hydratation (#418), et vos logs Umami montrent bien la chaîne `hydration-error-418` → `hydration-error-423` → `csr-fallback-triggered` → `error-boundary`.

Le problème critique actuel : le fallback CSR existe, mais il ne sauve pas toujours l’utilisateur. En Edge InPrivate, il tombe quand même sur l’ErrorBoundary, et les boutons Reload / Clear cache relancent la même séquence.

## Objectif

Faire une correction “quoiqu’il arrive” :

1. supprimer la cause HTML invalide immédiate ;
2. empêcher l’hydratation de bloquer l’app ;
3. rendre Reload / Clear cache réellement capables de sortir de la boucle ;
4. garder la page visible même si React échoue encore ;
5. réduire le bruit Umami pour distinguer les vrais crashs restants.

## Plan d’implémentation

### 1. Corriger la cause certaine : boutons imbriqués dans `StationCard`

Dans `src/components/StationCard.tsx` :

- remplacer les boutons “carte entière” par des éléments non imbriquants (`div`/`article` avec `role="button"`, `tabIndex=0`, gestion Enter/Space) ;
- garder le bouton favori comme vrai `<button>` séparé ;
- appliquer ce changement à tous les modes (`small`, `list`, `medium`, `large`, default) ;
- conserver les interactions existantes : clic carte = play, clic cœur = favori, hover prefetch, accessibilité clavier.

C’est prioritaire, car l’HTML invalide peut être réparé différemment par le parser navigateur avant que React hydrate, ce qui déclenche précisément #418.

### 2. Rendre le fallback CSR universel et immédiat

Dans `src/main.tsx` :

- ne plus limiter le bypass CSR au seul `sessionStorage`, fragile en mode privé/restrictif ;
- ajouter un fallback mémoire / URL marker temporaire si `sessionStorage` échoue ;
- en cas d’erreur d’hydratation (#418/#423/#425), ne pas dépendre uniquement d’un reload différé : déclencher un remount CSR direct quand possible ;
- garder le reload comme plan B uniquement si le remount direct n’est pas possible.

But : si l’hydratation casse, on vide `#root` et on rend avec `createRoot()` sans attendre que l’utilisateur reclique.

### 3. Corriger les boutons de récupération qui bouclent

Dans `src/components/ErrorBoundary.tsx` et `src/routes.tsx` :

- `Reload` doit forcer le mode CSR avant de recharger, pas juste refaire la même hydratation cassée ;
- `Clear cache & reload` doit aussi poser le flag CSR avant purge/reload ;
- après un crash, afficher un fallback utilisable qui privilégie “Continuer sans cache” plutôt qu’un simple reload.

But : même si l’utilisateur arrive sur l’écran “Something went wrong”, un clic le sort de la boucle.

### 4. Isoler encore plus le contenu dynamique du HTML SSG

Dans `src/pages/Index.tsx` :

- conserver le skeleton au premier rendu ;
- vérifier que le premier rendu hydraté ne contient pas de sections dépendantes de favoris/récents/langue détectée/router ;
- rendre le `Head` encore plus déterministe au premier rendu : titre/description home statiques avant mount, puis meta dynamiques après mount.

But : le HTML SSG et le premier rendu client restent identiques, même avec `fbclid`, Edge InPrivate, stockage restreint ou langue navigateur différente.

### 5. Ajouter un “static emergency shell” hors React

Dans `index.html` :

- ajouter un mini fallback HTML/CSS déjà présent dans `#root` ou adjacent, masqué dès que React démarre correctement ;
- si React ne démarre pas après quelques secondes, afficher ce shell avec logo + accès direct aux routes principales / message simple ;
- ne pas dépendre de localStorage, service worker, chunks lazy ou React.

But : même en cas de bundle cassé, chunk bloqué, extension, SW ou hydration catastrophique, l’utilisateur ne voit pas un écran vide.

### 6. Réduire le bruit Umami et rendre les prochains logs exploitables

Dans `src/main.tsx` :

- dédupliquer `error-boundary` / hydration sur une fenêtre courte ;
- enrichir l’event `error-boundary` avec `message`, `stack` tronquée, `route`, `csrForced`, `storageAvailable`, `privateLike` si détectable ;
- distinguer : `hydration-rescued`, `csr-remount-success`, `csr-remount-failed`, `manual-recovery-clicked`.

But : après déploiement, on saura si les visiteurs sont sauvés, pas seulement qu’une erreur est survenue.

## Vérification après implémentation

- tester `/` en viewport mobile et desktop ;
- vérifier qu’il n’y a plus de warning `<button>` dans `<button>` ;
- simuler un flag CSR et confirmer que l’app monte sans hydratation ;
- tester les boutons Reload / Clear cache depuis l’ErrorBoundary ;
- contrôler qu’aucun écran vide ne peut rester affiché si React tarde ou échoue.

## Priorité de livraison

Je ferais ça en une passe urgente, dans cet ordre :

1. `StationCard` boutons imbriqués ;
2. recovery CSR robuste dans `main.tsx` ;
3. boutons ErrorBoundary ;
4. emergency shell ;
5. télémétrie propre.

C’est le chemin le plus sûr pour arrêter la perte visiteurs rapidement, sans continuer à chercher une cause unique hypothétique.
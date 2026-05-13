# Plan d'arrêt de la fuite — hydration errors radiosphere.be

## Diagnostic des données Umami

Le rapport indique 99% de corrélation avec `fbclid` mais **seulement 1% des sessions sont en in-app browser** (Facebook). 99% sont **Chrome/Chromium-WebView Android**. La corrélation `fbclid` n'est donc **pas causale** : c'est un proxy pour « visiteur mobile Android nouveau, cache froid, qui passe réellement par l'hydratation » (vs. desktop / utilisateur récurrent qui sert le cache SW). Conclusion : **le code source contient un mismatch SSG/CSR systémique, qui ne déclenche le crash que sur les visites réelles en cold-load**.

## Cause racine identifiée (par investigation `rg`)

### 1. `Math.random()` dans le render de `AudioVisualizer`
`src/components/AudioVisualizer.tsx` lignes 47-50 — un `useMemo` calcule `duration`, `delay`, `--bar-min-scale` à partir de `Math.random()`. Au build SSG ces valeurs sont figées dans le HTML statique via les attributs `style=`. Au premier render client, React ré-exécute le `useMemo` et obtient des valeurs **différentes** → **mismatch direct sur l'attribut `style`** → React #418 → cascade #423 → fallback CSR → flash blanc.

`AudioVisualizer` est utilisé par `StationCard`, `MiniPlayer`, `DesktopPlayerBar`, `FullScreenPlayer`. Tous les players sont déjà sous `<ClientOnly>` dans `Index.tsx` ✅, **mais `StationCard` ne l'est pas** : il est rendu directement dans la home (`recent`, `favorites`, sections par genre) et dans les pages lazy. Dès qu'un visiteur a une favorite ou une station récente en localStorage, `StationCard` se re-render après hydratation avec `isPlaying=false` → pas d'AudioVisualizer initial. Mais `recent`/`favorites` initialisés à `[]` côté SSG ET côté client → en théorie pas de StationCard rendu au premier paint. **Le mismatch vient probablement d'un autre chemin** : la `SearchPage`/`HomePage` lazy-loaded peut réémettre AudioVisualizer juste après hydratation ce qui déclenche #423 dans le Suspense boundary qui n'a pas fini d'hydrater.

### 2. `Math.random()` dans `SidebarMenuSkeleton`
`src/components/ui/sidebar.tsx` ligne 536. Même schéma que ci-dessus si ce composant est jamais rendu côté SSG.

### 3. Le filet de secours CSR ne couvre pas les vrais affectés
`src/main.tsx` lignes ~280-295 : la rescue `__rsForceCSR` ne se déclenche **que si `isInAppBrowser()` est vrai**. Les 99% de sessions Chrome Android n'en bénéficient **jamais** → elles subissent la cascade complète sans recovery.

## Plan de correctif (3 fichiers, prioritaire)

### Étape 1 — Rendre `AudioVisualizer` déterministe au render SSG/premier paint
Fichier : `src/components/AudioVisualizer.tsx`

- Initialiser `instanceAnimations` à un tableau **déterministe** (utiliser `barAnimations[i % 9]` directement, sans variance, sans random).
- Calculer la version « variée » avec `Math.random()` **après** mount, dans un `useEffect` qui setState. Premier render = HTML stable identique SSG/client. Effet de variance appliqué juste après.
- Garde-fou : `useId()` au lieu de Math.random pour seed déterministe si on veut quand même un peu de variation visuelle.

### Étape 2 — Idem pour `SidebarMenuSkeleton`
Fichier : `src/components/ui/sidebar.tsx` ligne 535-537

- Remplacer `Math.floor(Math.random() * 40) + 50` par une largeur fixe (ex. `70%`) ou un pattern déterministe basé sur l'index du skeleton.

### Étape 3 — Étendre le filet de secours CSR à tous les navigateurs
Fichier : `src/main.tsx`

- Dans `reportHydrationError`, retirer la condition `isInAppBrowser()` qui gate le passage en mode CSR. Garder les autres garde-fous (sessionStorage one-shot, removal en cas d'échec du remount).
- Ajouter une dimension `webview: boolean` à l'event Umami `csr-fallback-triggered` pour pouvoir filtrer par cohorte ensuite.
- Effet : dès qu'**un seul** mismatch est détecté, le tab passe en CSR pur pour le reste de la session → impossible que l'utilisateur subisse 26 erreurs en cascade comme aujourd'hui.

## Détails techniques

```text
AVANT (mismatch garanti)
─────────────────────────
SSG build:    style="animation: bar 0.42s ease 0.18s ..."   ← random figé au build
Client first: style="animation: bar 0.51s ease 0.07s ..."   ← random différent
              ↳ React #418 → #423 → fallback CSR → flash blanc

APRÈS étape 1
─────────────
SSG build:    style="animation: bar 0.45s ease 0s ..."      ← déterministe (table fixe)
Client first: style="animation: bar 0.45s ease 0s ..."      ← identique ✅
              ↳ post-mount useEffect applique la variance, sans mismatch
```

## Vérification

1. `bun run build` (le harness le fait automatiquement) — pas de régression de build.
2. Reproduction locale : `npm run dev` puis ouvrir `http://localhost:5173/?fbclid=test123&utm_source=facebook` → vérifier dans la console que **plus aucune** erreur #418/#423 n'apparaît.
3. Dashboard Umami : surveiller les events `hydration-error`, `hydration-error-418`, `hydration-error-423`, `csr-fallback-triggered` sur 24h après déploiement. Cible : **−80% minimum** des trois premiers ; éventuel petit bump de `csr-fallback-triggered` (cohorte Chrome Android maintenant éligible) **suivi d'une chute** dès que les patches AudioVisualizer/sidebar sont en cache.

## Fichiers modifiés
- `src/components/AudioVisualizer.tsx` (déterminisme au render)
- `src/components/ui/sidebar.tsx` (déterminisme du skeleton)
- `src/main.tsx` (extension du filet CSR à tous les navigateurs)

Aucun autre fichier touché — pas de refactor, pas de changement business logic, pas de changement UI visible.

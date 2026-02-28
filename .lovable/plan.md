
Objectif: corriger le diagnostic Chromecast (icône absente + détection instable) et ajouter un fallback non-Chrome fiable, sans dépendre uniquement de `<google-cast-launcher>`.

Constats de l’audit (avec preuves dans le code actuel):
1) Le bouton est bien placé sur l’accueil et le fullscreen (`HomePage.tsx`, `FullScreenPlayer.tsx`), donc le problème n’est pas un oubli d’emplacement.
2) `CastButton.tsx` repose uniquement sur `<google-cast-launcher>`: sur non-Chrome (et souvent en contexte non supporté), l’élément ne rend rien visuellement.
3) `useCast.ts` logge “Web platform, loading Cast Sender SDK…”, mais on ne voit pas le log `__onGCastApiAvailable`, ce qui pointe un souci d’initialisation/race condition (script chargé avant callback).
4) En mode natif, `CastButton` n’exploite pas `startCast/stopCast`, donc même avec plugin Capacitor disponible il n’existe pas de vrai bouton d’action de secours.

Plan d’implémentation (séquencé):
1. Durcir l’initialisation Web Cast dans `src/hooks/useCast.ts`
- Introduire une fonction interne `initWebCastContext()` appelée dans 2 cas:
  - quand `__onGCastApiAvailable` est déclenché
  - immédiatement si `window.cast?.framework` existe déjà (corrige la race condition).
- Conserver l’App ID `65257ADB`.
- Ajouter une détection explicite d’environnement supporté web (Chrome/Edge Chromium + Cast framework disponible).
- Ajouter un timeout de sécurité pour marquer l’état “SDK indisponible” si callback jamais reçu.
- Exposer un état UI additionnel (ex: `castUiMode: "launcher" | "native" | "fallback"` ou `isCastSupportedWeb`) pour piloter le composant bouton.

2. Refaire `src/components/CastButton.tsx` en mode hybride
- Mode `launcher` (Chrome supporté): garder `<google-cast-launcher>`.
- Mode `native` (Capacitor): afficher un vrai bouton React (icône Cast Lucide) qui appelle `startCast()` / `stopCast()`.
- Mode `fallback` (non-Chrome/non-supporté): afficher une icône Cast désactivée mais visible + message explicatif (tooltip/toast) du type “Chromecast disponible dans Chrome ou l’app Android”.
- Résultat attendu: l’icône ne “disparaît” plus; elle a toujours un comportement clair selon la plateforme.

3. Lier la synchro UI/état Cast en temps réel dans `src/contexts/PlayerContext.tsx`
- Ajouter un effet: si `isCasting === true` et une station est déjà en cours, lancer `castLoadMedia(currentStation)` automatiquement (évite état connecté sans audio casté).
- Ajouter un effet sur changement de station pendant le cast pour pousser automatiquement le nouveau média.
- Conserver l’affichage `isCasting/castDeviceName` déjà utilisé dans MiniPlayer et FullScreen.

4. Traductions UX fallback dans `src/i18n/translations.ts`
- Ajouter des clés multilingues minimales:
  - `cast.unsupportedBrowser`
  - `cast.openInChrome`
  - `cast.nativeOnlyHint`
- Utiliser ces clés dans le bouton fallback (évite textes hardcodés).

5. Vérification ciblée (après implémentation)
- Chrome desktop: l’icône launcher apparaît, ouverture du sélecteur, connexion OK, nom du device visible.
- Firefox/Safari: icône fallback visible + message d’orientation, pas d’UI “fantôme”.
- Android Capacitor: bouton natif visible sur accueil + fullscreen, ouverture dialogue cast, `isCasting` mis à jour.
- Cas limite: script Cast chargé avant React (la nouvelle init immédiate doit quand même fonctionner).

Fichiers concernés:
- `src/hooks/useCast.ts` (initialisation robuste + états de support)
- `src/components/CastButton.tsx` (3 modes: launcher/native/fallback)
- `src/contexts/PlayerContext.tsx` (sync cast session ↔ station active)
- `src/i18n/translations.ts` (messages fallback)

Risques/points d’attention:
- Le preview Lovable en iframe peut limiter la découverte Cast; il faudra valider aussi hors iframe (Chrome normal) et sur APK.
- App ID non publié: seuls appareils autorisés en mode test seront détectables.
- Pour la partie native Android: après merge, faire `git pull` puis `npx cap sync` avant rebuild APK.

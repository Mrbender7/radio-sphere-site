

## Plan : Suppression totale de la logique d'analyse d'artwork

### Contexte
Le TBM fonctionne sur APK/emulateur (CORS contourne par la WebView Android). Sur la preview web, `fetch()` est bloque par CORS -- c'est normal et attendu. Pas de bug dans StreamBufferContext, il est propre.

La demande : supprimer toute la logique de scan/remplacement des artworks basse qualite. Garder uniquement le fallback `onError` sur le placeholder HD.

### Fichiers a modifier

**1. Supprimer `src/hooks/useArtworkCache.ts`**
- Ce fichier entier n'a plus de raison d'exister. Il contient `scanFavoritesQuality`, `getReplaceLowQuality`, `setReplaceLowQuality`, `validateImage`.
- L'export `stationPlaceholder` est importe directement depuis `@/assets/station-placeholder.png` partout ou c'est necessaire.

**2. `src/pages/SettingsPage.tsx`**
- Supprimer l'import de `useArtworkCache` (ligne 9)
- Supprimer l'import `ImageOff` du destructuring lucide (ligne 7)
- Supprimer le state `replaceLowQuality` (ligne 118)
- Supprimer toute la section "Replace low-quality artworks toggle" (lignes 421-441)

**3. `src/contexts/FavoritesContext.tsx`**
- Retirer `updateFavorite` de l'interface et du Provider (lignes 10, 19, 33)
- Cette fonction n'etait utilisee que par le scan d'artworks

**4. `src/hooks/useFavorites.ts`**
- Retirer la fonction `updateFavorite` (lignes 35-37) et son export (ligne 62)

**5. `src/i18n/translations.ts`**
- Supprimer les cles `settings.replaceLowQuality` et `settings.replaceLowQualityDesc` dans les 5 langues
- Garder `favorites.purgeArtworkCache` (traduction existante, meme si pas utilisee en code -- nettoyage optionnel)

**6. `src/components/SmartArtwork.tsx`** -- Aucun changement
- Deja simplifie : affiche l'URL directe, fallback `onError` sur placeholder. Parfait tel quel.

**7. `src/contexts/StreamBufferContext.tsx`** -- Aucun changement
- Propre, pas de proxy, pas de reference au cache artwork. Fonctionne sur Android, bloque par CORS sur web (attendu).

**8. `archives/radiosphere_v2_5_0.ps1`** -- Aucun changement
- Ne contient aucune reference au cache artwork.

### Resume des suppressions
- 1 fichier supprime (`useArtworkCache.ts`)
- 1 section UI supprimee (toggle dans Settings)
- 1 fonction supprimee (`updateFavorite` dans useFavorites + FavoritesContext)
- ~10 cles i18n supprimees
- 1 localStorage key plus jamais ecrite (`radiosphere_replace_low_quality`)


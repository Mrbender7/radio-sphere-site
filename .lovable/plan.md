

# Plan de modifications

## 1. Ajouter 10 genres supplementaires dans SearchPage

**Fichier** : `src/pages/SearchPage.tsx`

La liste `GENRES` (ligne 30) passe de 14 a 24 genres. Les genres obligatoires (60s, metal, country) sont inclus, plus 7 autres choisis pour couvrir un large spectre musical :

```
"60s", "70s", "80s", "90s", "ambient", "chillout", "classical", "country",
"electronic", "funk", "hiphop", "jazz", "latin", "metal", "news", "pop",
"r&b", "reggae", "rock", "soul", "techno", "trance", "blues", "world"
```

Genres ajoutes : **60s, country, metal, funk, latin, reggae, techno, trance, blues, world**.

---

## 2. Corriger le chevauchement du bas du FullScreen Player avec la barre de navigation

**Fichier** : `src/components/FullScreenPlayer.tsx`

Le probleme visible sur les screenshots : la grille Codec/Bitrate/Langue est coupee par la barre de navigation Android.

Le padding bottom actuel utilise `pb-[calc(max(env(safe-area-inset-bottom,16px),1rem)+2rem)]` sur le conteneur des controles (ligne 92). Ce padding est insuffisant.

**Correction** : Augmenter le padding bottom a `pb-[calc(max(env(safe-area-inset-bottom,16px),1rem)+4rem)]` pour laisser assez d'espace au-dessus de la barre de navigation systeme. De plus, ajouter `overflow-y-auto` sur le conteneur principal pour permettre le defilement si le contenu depasse.

---

## 3. Griser la section Premium et ajouter un filigrane "Arrive bientot / Coming soon"

**Fichier** : `src/pages/SettingsPage.tsx`

Dans la `CollapsibleSection` Premium (lignes 100-140) :

- Envelopper le contenu interieur dans un `div` avec `relative` et `pointer-events-none opacity-50` pour griser tout le contenu Premium (features, boutons, disclaimer).
- Ajouter un overlay absolu par-dessus avec le texte "Arrive bientot" (FR) / "Coming soon" (EN) en filigrane, incline, avec une opacite moderee et un style visible.
- Les boutons d'abonnement seront desactives visuellement grace au `pointer-events-none`.

### Detail technique

```text
CollapsibleSection (Premium)
  +-- div.relative
  |     +-- div.opacity-50.pointer-events-none  (contenu existant grise)
  |     +-- div.absolute.inset-0 (overlay filigrane "Arrive bientot / Coming soon")
```

**Fichier** : `src/i18n/translations.ts`

Ajouter les cles de traduction :
- `"premium.comingSoon"` : "Arrive bientot" (FR) / "Coming soon" (EN)




# Plan : Bandeau d'onboarding + Optimisation SEO

## 1. Composant `OnboardingBanner`

**Nouveau fichier** : `src/components/OnboardingBanner.tsx`

- Carte flottante élégante en bas à droite (desktop) / bandeau en bas (mobile), au-dessus du MiniPlayer
- Thème sombre avec bordure subtile gradient, fond `bg-card/95 backdrop-blur`
- 3 highlights avec icônes Lucide (`Gift`, `ShieldOff`, `Clock`) + texte court
- Bouton CTA "Disponible sur Google Play" (lien placeholder `#` pour l'instant)
- Bouton fermer (X) en haut à droite
- Micro-animations : `hover:scale-105` sur les items, `animate-fade-in` à l'apparition
- **localStorage** : clé `radiosphere_onboarding_banner_dismissed`. Si `true`, le composant ne se rend pas. Au clic sur X, on set la clé et on masque.

**Structure** :
```text
┌──────────────────────────────────────┐
│  [X]                                 │
│  🎁 100% Gratuit                     │
│  🚫 Zéro Publicité Ajoutée          │
│  ⏪ TimeBack Machine exclusive       │
│                                      │
│  [ Disponible sur Google Play ]      │
└──────────────────────────────────────┘
```

**Intégration** : dans `src/pages/HomePage.tsx`, affiché en haut du contenu scrollable, avant les sections existantes.

Traductions ajoutées dans `src/i18n/translations.ts` pour les 5 langues (clés `onboarding.free`, `onboarding.noAds`, `onboarding.tbm`, `onboarding.cta`, etc.).

## 2. Optimisation SEO — `index.html`

- **Title** : `Radio Sphere — Radio gratuite sans pub | TimeBack Machine` (≤60 chars)
- **Meta description** : `Écoutez 50 000+ stations radio gratuites sans publicité. Découvrez la TimeBack Machine pour réécouter le direct. Streaming HD, Chromecast.` (≤155 chars)
- **OG tags** : mettre à jour `og:title` et `og:description` avec les mêmes textes optimisés
- **Twitter tags** : idem
- **JSON-LD** : enrichir le schema existant avec `featureList`, `keywords`, `screenshot`, `aggregateRating` placeholder

## 3. Sémantique HTML

- `HomePage.tsx` : le `h1` mobile existe déjà ("Radio Sphere"). Le changer en `h1` unique contenant "Radio Sphere — Le lecteur radio gratuit sans publicité" (visible uniquement pour les screen readers via `sr-only` pour la partie longue, pour ne pas casser le design).
- Les sections existantes utilisent déjà des `h2` — OK.

## 4. Alt text sur les stations

- Dans `SmartArtwork.tsx` : le prop `alt` est déjà passé. Vérifier dans `StationCard.tsx` que l'alt contient le nom de la station. Actuellement le composant passe `alt` — je mettrai à jour les appels pour passer `alt={`Écouter ${station.name} en direct sur Radio Sphere`}` dans `StationCard.tsx`.

## Fichiers modifiés

| Fichier | Changement |
|---|---|
| `src/components/OnboardingBanner.tsx` | **Nouveau** — composant bandeau |
| `src/pages/HomePage.tsx` | Import + affichage du banner, h1 SEO |
| `src/i18n/translations.ts` | Clés onboarding (5 langues) |
| `index.html` | Title, meta, OG, JSON-LD optimisés |
| `src/components/StationCard.tsx` | Alt text dynamique sur SmartArtwork |


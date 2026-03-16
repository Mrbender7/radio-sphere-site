

## Plan

### 1. Ajouter le bandeau d'accueil sur la page À propos

Importer et placer `<OnboardingBanner />` dans `AboutPage.tsx`, juste après le header (ligne ~96), avant la section Language.

### 2. Clarification sur les pubs injectées dans les flux

Tu as raison : **il est techniquement impossible de bloquer les publicités injectées directement dans les flux audio des stations**. Ces pubs font partie intégrante du stream côté serveur de la radio — elles sont encodées dans le même flux audio que le contenu. Radio Sphere ne fait que relayer le flux tel quel, sans modification. Il n'y a aucun moyen de les filtrer côté client sans casser le flux.

### 3. Adapter la mention "Zéro Publicité"

Pour être transparent, je propose de :

- **Modifier le texte du bandeau** : changer la description de "Zéro Publicité" pour préciser que Radio Sphere n'ajoute aucune pub, mais que les stations peuvent inclure leurs propres pubs dans leur flux.
  - FR : `"Zéro Publicité Ajoutée"` / desc : `"Aucune pub ajoutée par Radio Sphere. Les stations peuvent inclure leurs propres annonces dans leur flux."`
  - Idem pour EN, ES, DE, JA.

- **Ajouter une note dans la page À propos** : une petite section informative (ou dans le bandeau) expliquant que les pubs entendues proviennent des stations elles-mêmes et non de Radio Sphere.

- **Mettre à jour la politique de confidentialité** (section thirdParty) pour mentionner que les flux audio peuvent contenir des publicités insérées par les stations émettrices.

### Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/pages/AboutPage.tsx` | Import + ajout `<OnboardingBanner />` |
| `src/i18n/translations.ts` | Mise à jour des clés `onboarding.noAds` / `onboarding.noAdsDesc` (5 langues) + nouvelle clé pour disclaimer flux |
| `src/pages/PrivacyPolicyPage.tsx` | Ajout mention pubs dans les flux audio |




# Plan v2.2.8e -- Roadmap + Deverrouillage test + Mode d'emploi

## 1. Mise a jour du Premium Roadmap

Mettre a jour `docs/PREMIUM_ROADMAP.md` :
- Android Auto : statut "Termine" (v2.2.8d)
- Sleep Timer : statut "Termine"
- Ajouter la fonctionnalite "Mode d'emploi integre" dans la liste
- Mettre a jour les notes techniques (version v2.2.8e)

## 2. Deverrouiller le premium pour la periode de test Google

Dans `src/contexts/PremiumContext.tsx`, changer la valeur initiale de `isPremium` a `true` pour que toutes les fonctionnalites premium soient accessibles sans code durant la periode de test Google Play.

Cela supprime automatiquement :
- Le filigrane "Arrive bientot" sur le Sleep Timer
- Le filigrane "Arrive bientot" sur la section Premium
- Le `pointer-events-none` et `opacity-50` sur ces sections

## 3. Mode d'emploi dans les reglages

### Composant `UserGuideModal`

Creer un composant modal (`Dialog`) accessible depuis les reglages via un bouton. La modale contient des sections repliables en accordeon -- **un seul ouvert a la fois** (quand on en ouvre un, l'autre se ferme).

Sections prevues (une par onglet de l'app) :

| Section | Contenu |
|---------|---------|
| Accueil | Stations recentes, populaires, favoris rapides, decouverte hebdomadaire, genres |
| Recherche | Barre de recherche, filtres pays/genre/langue, tri, chargement progressif |
| Favoris | Ajouter/retirer un favori, export/import CSV, partage |
| Reglages | Langue, minuterie, premium, gestion favoris, politique de confidentialite |

### Implementation technique

- Composant : `src/components/UserGuideModal.tsx`
- Pattern accordeon : un seul `openSection` en state (`string | null`), cliquer sur une section set son id ou `null` si deja ouverte
- Traductions i18n : ajout de ~20 cles dans `src/i18n/translations.ts` (fr + en)
- Bouton d'acces dans `SettingsPage.tsx` : icone `BookOpen` + texte "Mode d'emploi" / "User Guide", place avant les disclaimers
- Style : coherent avec le theme existant (bg-accent, rounded-xl, gradient pour le titre)

### Mise a jour version

`SettingsPage.tsx` ligne 443 : passer de `v2.2.7` a `v2.2.8e`

## Fichiers modifies

| Fichier | Action |
|---------|--------|
| `docs/PREMIUM_ROADMAP.md` | Mise a jour statuts et ajout mode d'emploi |
| `src/contexts/PremiumContext.tsx` | `isPremium` initialise a `true` |
| `src/i18n/translations.ts` | Ajout traductions mode d'emploi (fr + en) |
| `src/components/UserGuideModal.tsx` | Nouveau composant modal accordeon |
| `src/pages/SettingsPage.tsx` | Bouton mode d'emploi + version v2.2.8e |


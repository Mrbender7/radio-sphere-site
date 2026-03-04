

## Plan : Compteur de résultats dans la recherche

Ajouter un compteur affichant le nombre total de stations trouvées, positionné juste sous le bouton "Réinitialiser les filtres".

### Ce qui change

**Fichier : `src/pages/SearchPage.tsx`**
- Après le bouton `clearFilters` (ligne ~373), ajouter un texte discret affichant `allResults.length` stations trouvées (ex: "42 stations trouvées")
- Le compteur n'apparaît que quand des résultats existent et que le chargement est terminé
- Style : texte petit (`text-xs`), couleur `text-muted-foreground`, discret mais visible

**Fichier : `src/i18n/translations.ts`**
- Ajouter la clé `search.resultsCount` dans toutes les langues (ex: FR "stations trouvées", EN "stations found", etc.)

### Comportement
- Visible uniquement quand `allResults.length > 0` et `!isLoading`
- Se met à jour automatiquement quand on charge plus de stations via "Plus de stations"
- Disparaît quand les filtres sont vidés (pas de résultats)




# Plan : Genres manquants + Tri par pays des favoris + Note Collections

## 1. Ajouter les 10 animations SVG manquantes

Ajouter dans `src/components/GenreAnimations.tsx` les 10 composants SVG suivants, en blanc avec le meme style (drop-shadow blanc, stroke round, animations SVG natives) :

| Genre | Animation |
|-------|-----------|
| 60s | Fleur peace & love avec petales qui pulsent |
| blues | Guitare acoustique avec cordes qui vibrent |
| country | Banjo avec cordes vibrantes |
| funk | Ligne de basse ondulante (waveform funky) |
| latin | Maracas avec mouvement de secousse |
| metal | Eclair/foudre pulsant |
| reggae | Onde sonore relaxante (vagues lentes) |
| techno | Forme d'onde geometrique (carree/repetitive) |
| trance | Spirale hypnotique qui tourne |
| world | Globe avec lignes meridiennes |

Ajouter ces 10 entrees dans le `GENRE_MAP`.

Mettre a jour la liste `GENRES` dans `HomePage.tsx` pour inclure les 10 nouveaux genres : `["60s", "70s", "80s", "90s", "ambient", "blues", "chillout", "classical", "country", "electronic", "funk", "hiphop", "jazz", "latin", "metal", "news", "pop", "r&b", "reggae", "rock", "soul", "techno", "trance", "world"]`.

Ajouter egalement les couleurs de fond correspondantes dans `GENRE_COLORS`.

## 2. Tri par pays dans les favoris (LibraryPage)

Modifier `src/pages/LibraryPage.tsx` pour ajouter un selecteur de tri :
- **A-Z** (par defaut, tri actuel par nom)
- **Par pays** (regroupe les stations par `country`, avec un sous-titre separateur pour chaque pays, tries alphabetiquement)

Implementation :
- Ajouter un state `sortMode: "name" | "country"` 
- Deux boutons toggle sous le titre "Favoris" (style identique aux boutons de tri de SearchPage : pills arrondies)
- En mode "country" : grouper les favoris par `station.country`, trier les groupes alphabetiquement, afficher un separateur texte pour chaque pays
- Ajouter les traductions FR/EN dans `translations.ts` : `"favorites.sortName"`, `"favorites.sortCountry"`

## 3. Note future : Collections (Premium Roadmap)

Ajouter dans `docs/PREMIUM_ROADMAP.md` une nouvelle section dans les fonctionnalites premium futures :

```
### 10. Collections personnalisees
- Creer des collections thematiques dans les favoris (ex: "Chill", "Workout", "Jazz du soir")
- Glisser-deposer des stations entre collections
- Icone et couleur personnalisables par collection
- **Statut** : A venir (Premium)
```

## Fichiers modifies

1. `src/components/GenreAnimations.tsx` -- ajouter 10 animations SVG + entrees GENRE_MAP
2. `src/pages/HomePage.tsx` -- etendre GENRES et GENRE_COLORS avec les 10 nouveaux genres
3. `src/pages/LibraryPage.tsx` -- ajouter selecteur tri A-Z / par pays avec regroupement
4. `src/i18n/translations.ts` -- ajouter traductions pour tri favoris
5. `docs/PREMIUM_ROADMAP.md` -- ajouter note Collections




# Mise a jour UX — Recherche, Accueil interactif et Premium

## 1. Recherche par pays avec Select/Dropdown + bouton Reset

**SearchPage.tsx** : Remplacer les chips "Pays" par un composant `Select` (shadcn/ui) avec un mapping francais/drapeau vers nom anglais API.

Liste des pays :
- France, Belgique, Suisse, Canada, Allemagne, USA, Espagne, Italie, Royaume-Uni

Le Select affichera par exemple "France (drapeau FR)" mais enverra `"France"` a l'API. Pour les USA, il enverra `"The United States Of America"`.

Le bouton "Reinitialiser" existant reste, et on ajoute un bouton croix (X) dans la barre de recherche elle-meme pour vider le texte rapidement.

## 2. Cartes de genre cliquables sur la page d'accueil

**HomePage.tsx** : Ajouter un callback `onGenreClick` en prop. Au clic sur une carte genre, appeler ce callback avec le tag correspondant.

**Index.tsx** : Quand `onGenreClick` est appele, basculer sur l'onglet "search" et passer le genre selectionne a `SearchPage`.

**SearchPage.tsx** : Accepter une prop optionnelle `initialGenre` qui pre-remplit le filtre genre au montage (avec un `useEffect` pour synchroniser).

## 3. Etat Premium mock

Creer un contexte `PremiumContext.tsx` avec un simple state `isPremium` (defaut `false`) et un toggle. Le provider sera place dans `Index.tsx`. La page Premium utilisera ce contexte pour afficher "Vous etes Premium" ou les boutons d'achat. Cela permettra plus tard de conditionner l'affichage de pubs.

---

## Details techniques

### Fichiers modifies

1. **`src/pages/SearchPage.tsx`**
   - Importer `Select, SelectTrigger, SelectContent, SelectItem, SelectValue` depuis shadcn/ui
   - Definir un tableau `COUNTRIES_MAP` avec `{ label: "France (drapeau FR)", value: "France" }`, etc.
   - Remplacer la section filtre "Pays" (chips) par un `Select` avec placeholder "Choisir un pays"
   - Ajouter un bouton X dans l'input de recherche pour vider le texte
   - Ajouter prop `initialGenre?: string` et un `useEffect` pour le synchroniser avec l'etat `genre`

2. **`src/pages/HomePage.tsx`**
   - Ajouter prop `onGenreClick: (genre: string) => void`
   - Passer `onClick` sur chaque `GenreCard` qui appelle `onGenreClick(genre)`

3. **`src/pages/Index.tsx`**
   - Ajouter state `selectedGenre` 
   - Handler `handleGenreClick` : set genre + switch tab to "search"
   - Passer `selectedGenre` a SearchPage et `onGenreClick` a HomePage
   - Reset `selectedGenre` quand on quitte l'onglet search

4. **`src/contexts/PremiumContext.tsx`** (nouveau)
   - Contexte avec `isPremium: boolean` et `togglePremium: () => void`
   - Stockage dans `localStorage`

5. **`src/pages/PremiumPage.tsx`**
   - Utiliser `PremiumContext` pour afficher un badge "Premium actif" si `isPremium` est true
   - Les boutons d'achat appelleront `togglePremium()` (mock)


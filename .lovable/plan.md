

## Modifications prevues

### 1. Header fixe sur la page d'accueil

Actuellement, le titre "Radio Sphere" avec le logo defilent avec le reste du contenu. Le header sera extrait et place au-dessus de la zone scrollable, avec un fond opaque (`bg-background`) pour que le contenu passe en dessous sans transparence.

### 2. Suppression du bouton engrenage (Settings)

Le bouton Settings (icone engrenage) a droite du titre sera supprime puisqu'un onglet "Reglages" existe deja dans la barre de navigation. La prop `onSettingsClick` sera retiree de `HomePage` et de `Index.tsx`.

### 3. Avertissement donnees mobiles dans les Reglages

Un encart d'avertissement sera ajoute dans `SettingsPage` sous la section langue, avec une icone et un texte informant que l'ecoute de radio consomme des donnees mobiles. Les traductions FR/EN seront ajoutees dans `translations.ts`.

---

### Details techniques

**`src/pages/HomePage.tsx`**
- Restructurer le JSX : le conteneur principal passe de `overflow-y-auto` a `flex flex-col overflow-hidden`
- Le header (logo + titre) devient une div fixe avec `bg-background px-4 pt-6 pb-4`
- Le contenu scrollable (recently played, popular, genres) va dans une div enfant avec `flex-1 overflow-y-auto px-4 pb-4`
- Supprimer l'import `Settings` de lucide-react, retirer le bouton engrenage et la prop `onSettingsClick`

**`src/pages/Index.tsx`**
- Retirer le passage de `onSettingsClick` et le callback `handleSettingsClick`

**`src/pages/SettingsPage.tsx`**
- Ajouter un bloc avertissement apres la section langue avec une icone `Wifi` de lucide-react
- Texte d'avertissement sur la consommation de donnees mobiles

**`src/i18n/translations.ts`**
- Ajouter les cles `settings.dataWarning` et `settings.dataWarningDesc` en FR et EN
  - FR : "Utilisation des donnees" / "L'ecoute de stations de radio utilise votre connexion internet et peut consommer des donnees mobiles. Nous recommandons une connexion Wi-Fi pour une utilisation prolongee."
  - EN : "Data usage" / "Listening to radio stations uses your internet connection and may consume mobile data. We recommend using Wi-Fi for extended listening."

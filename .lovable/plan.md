

# Android Auto v2.4.8 — Flux, Recherche, Tri, Indicateurs

## Problemes identifies

### 1. Certains flux ne demarrent pas sur AA
**Cause racine** : La resolution d'URL dans `resolveStreamUrl` a plusieurs faiblesses :
- Pas de header `User-Agent` dans les requetes HTTP — certains serveurs (comme dparkradio.com) rejettent les requetes sans User-Agent
- Detection de playlist basee uniquement sur l'extension URL, pas sur le Content-Type reponse
- `parsePlsPlaylist` ne cherche que `File1=` en minuscule exacte — certains fichiers PLS utilisent `file1=` ou des casses variables
- `httpGet` n'envoie pas de User-Agent non plus
- Timeout de 5s peut etre trop court pour des serveurs lents

### 2. Pas d'indicateur de chargement
Le code met bien `STATE_BUFFERING` mais si la resolution d'URL echoue silencieusement (exception attrapee, URL originale retournee), ExoPlayer recoit une URL non jouable et reste en buffering indefiniment sans feedback utilisateur. Apres le protocol fallback, l'etat passe a `STATE_ERROR` mais sans message d'erreur visible.

### 3. Recherche manquante
`onSearch` et `onPlayFromSearch` sont implementes (recherche vocale). Mais il manque une entree "Recherche" dans l'arbre de navigation. Sur Android Auto, on peut ajouter une categorie "Top Stations" car la saisie clavier n'est pas possible en conduite — la recherche vocale via le micro AA est deja fonctionnelle.

### 4. Tri alphabetique des favoris
`loadStations` retourne les stations dans l'ordre du JSON stocke, sans tri. Les favoris devraient etre tries alphabetiquement.

---

## Plan de corrections

### Fichier 1 : `android-auto/RadioBrowserService.java`

**a) Ajouter User-Agent a toutes les requetes HTTP**
- `followRedirects` : ajouter `conn.setRequestProperty("User-Agent", "RadioSphere/1.0")`
- `httpGet` : ajouter `conn.setRequestProperty("User-Agent", "RadioSphere/1.0")`

**b) Detection playlist par Content-Type**
- Dans `resolveStreamUrl`, apres `followRedirects`, faire une requete HEAD pour lire le Content-Type
- Si Content-Type contient `audio/x-scpls` → traiter comme PLS
- Si Content-Type contient `audio/mpegurl` ou `audio/x-mpegurl` → traiter comme M3U
- Garder aussi la detection par extension URL comme fallback

**c) PLS parsing plus robuste**
- `parsePlsPlaylist` : chercher `fileN=` (n'importe quel numero) en case-insensitive, pas seulement `file1=`

**d) Tri alphabetique des favoris**
- Apres `parseStationsJson`, trier la liste par `name` (case-insensitive) quand on charge les favoris

**e) Remplacer "Genres" par "Top Stations"**
- Dans `onLoadChildren(ROOT_ID)` : remplacer l'entree "Genres" par "Top Stations" qui charge les stations les plus populaires via l'API
- La recherche vocale reste disponible via le bouton micro d'Android Auto (deja fonctionnel via `onPlayFromSearch`)

**f) Meilleur feedback d'erreur**
- Dans `updatePlaybackState`, quand state = ERROR, ajouter un message d'erreur via `setErrorMessage`
- Reduire le buffering timeout de 10s a 15s pour laisser plus de temps aux serveurs lents avant de tenter le fallback

**g) Augmenter les timeouts HTTP**
- Passer de 5000ms a 8000ms pour `connectTimeout` et `readTimeout`

### Fichier 2 : `radiosphere_v2_4_7.ps1`
- Appliquer exactement les memes modifications au RadioBrowserService.java embarque dans le script PS1 (lignes 680-1230)
- Mettre a jour le numero de version dans les logs de sortie

---

## Detail technique des modifications

### resolveStreamUrl ameliore (pseudo-code)
```text
1. followRedirects(url, 5)  // avec User-Agent
2. HEAD request sur URL resolue → lire Content-Type
3. Si Content-Type = audio/x-scpls OU URL contient .pls → parsePlsPlaylist
4. Si Content-Type = audio/mpegurl OU URL contient .m3u → parseM3uPlaylist  
5. Sinon → retourner URL resolue directement
```

### Nouveau root browse tree
```text
Root
├── Favoris        (stations triees A-Z)
├── Recents        (dernieres ecoutees)
└── Top Stations   (top 25 par votes via API)
```
La recherche reste accessible via le bouton micro Android Auto (deja implemente).

### Tri favoris
```java
list.sort((a, b) -> a.name.compareToIgnoreCase(b.name));
```

---

## Fichiers modifies
1. `android-auto/RadioBrowserService.java` — Resolution URL, tri, top stations, feedback erreur
2. `radiosphere_v2_4_7.ps1` — Meme code embarque mis a jour

## Aucun changement frontend
Tout est cote natif Java.


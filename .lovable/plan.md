

# Fix Build — Convertir les fichiers Kotlin en Java

## Probleme

Le build echoue car `MainActivity.java` importe `RadioAutoPlugin` qui est defini dans un fichier `.kt` (Kotlin). Le projet Capacitor genere par defaut est un projet **Java-only** : il n'a pas le plugin Gradle Kotlin (`apply plugin: 'kotlin-android'`), donc les fichiers `.kt` sont ignores par le compilateur.

Erreur :
```
import com.radiosphere.app.RadioAutoPlugin;
                          ^
  symbol:   class RadioAutoPlugin
  location: package com.radiosphere.app
```

## Solution

Convertir les deux fichiers Kotlin embarques dans le script en **Java**, ce qui evite toute modification du systeme de build Gradle. C'est plus robuste que d'ajouter le support Kotlin car ca evite les conflits de versions.

## Modifications dans `radiosphere_v2_2_5.ps1`

### 1. `RadioAutoPlugin.kt` devient `RadioAutoPlugin.java`

Conversion directe du plugin Capacitor de Kotlin vers Java. Meme logique SharedPreferences, meme API.

### 2. `RadioBrowserService.kt` devient `RadioBrowserService.java`

Conversion du service MediaBrowserServiceCompat (~405 lignes) de Kotlin vers Java. Meme logique ExoPlayer, browse tree, recherche vocale.

### 3. Correction de l'etape 6

- Remplacer les here-strings Kotlin par des here-strings Java
- Changer les noms de fichiers de `.kt` a `.java` dans les `WriteAllText`
- Le placeholder `__PACKAGE__` reste le meme

### 4. Etape 7 — Patch MainActivity

- La branche Java du patch est deja correcte (elle importe `RadioAutoPlugin` comme classe Java)
- Supprimer ou ignorer la branche Kotlin du patch qui n'est pas utilisee

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `radiosphere_v2_2_5.ps1` | Remplacer les 2 here-strings Kotlin par du Java, changer les noms de fichiers de sortie |

## Impact

- Aucun changement dans le code web
- Le Gradle n'a plus besoin du plugin Kotlin
- Compatibilite totale avec le projet Capacitor Java par defaut

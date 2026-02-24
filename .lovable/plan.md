

# Fix Script v2.2.5 — Fichiers natifs embarques dans le script

## Probleme

Le script clone le repo GitHub, mais les fichiers `android-auto/RadioBrowserService.kt`, `android-auto/RadioAutoPlugin.kt` et `android-auto/res/xml/automotive_app_desc.xml` n'existent pas dans le repo (ils ont ete crees uniquement dans Lovable). Le script echoue avec des erreurs "Impossible de trouver le chemin d'acces".

## Solution

Embarquer le contenu complet des 3 fichiers natifs directement dans le script PowerShell sous forme de here-strings (`@"..."@`), au lieu de les lire depuis des fichiers externes. Le script generera les fichiers directement dans le dossier Android correct.

## Modifications

### Fichier modifie : `radiosphere_v2_2_5.ps1`

**Etape 3b** — `automotive_app_desc.xml` : Remplacer la logique de copie par une generation directe du fichier XML via here-string (le fallback existant fait deja ca, on le rend principal).

**Etape 6** — Fichiers Kotlin : Remplacer les `Get-Content "android-auto/..."` par des here-strings contenant le code complet de :
- `RadioBrowserService.kt` (~405 lignes) — service MediaBrowserServiceCompat avec ExoPlayer, browse tree, recherche vocale
- `RadioAutoPlugin.kt` (~69 lignes) — plugin Capacitor pour SharedPreferences

Le remplacement du package (`app.lovable.radiosphere` -> package detecte) sera applique sur les here-strings au lieu des fichiers lus.

## Impact

- Aucun fichier web modifie
- Le script devient 100% autonome, sans dependance aux fichiers du repo
- Le dossier `android-auto/` dans Lovable reste comme reference/documentation


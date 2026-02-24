

# Fix Build Android — automotive_app_desc.xml manquant

## Probleme

Le build echoue car le AndroidManifest reference `@xml/automotive_app_desc` mais le fichier XML n'a pas ete copie dans `android/app/src/main/res/xml/`.

Erreur exacte :
```
AAPT: error: resource xml/automotive_app_desc (aka com.radiosphere.app:xml/automotive_app_desc) not found.
```

## Cause

Le script PowerShell v2.2.5 a deux problemes :
1. La copie du fichier XML (etape 6) peut echouer silencieusement si le chemin source est incorrect
2. La permission `INTERNET` est injectee en doublon (warning dans le build)

## Corrections a apporter

### 1. Script PowerShell `radiosphere_v2_2_5.ps1`

- Deplacer la creation du dossier `res/xml` et la copie de `automotive_app_desc.xml` **avant** l'injection dans le manifest (etape 4), avec une verification explicite que le fichier a bien ete copie
- Ajouter une garde pour ne pas injecter la permission `INTERNET` si elle existe deja dans le manifest
- Ajouter une verification post-copie avec message d'erreur clair si le fichier n'est pas present

### 2. Verification des permissions dupliquees

Dans la section d'injection des permissions (etape 4), verifier chaque permission avant de l'ajouter pour eviter les doublons.

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `radiosphere_v2_2_5.ps1` | Reorganiser l'ordre des etapes, ajouter verifications, corriger doublons permissions |

## Impact

Aucun impact sur le code web. Correction uniquement du workflow de build natif Android.


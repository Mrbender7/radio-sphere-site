

## Diagnostic : Pas de son sur le Cast — Analyse de l'agent Android Studio

L'agent Android Studio a raison sur les 3 points. Voici mon analyse croisee avec le code actuel :

### Probleme 1 : Forcage HTTPS — CONFIRME, cause principale probable

Le code force `http://` → `https://` a **trois endroits** :
- `CastPlugin.java` ligne 320-322 (et sa copie dans le ps1 ligne 502)
- `cast-receiver.html` lignes 405-411 (intercepteur LOAD)
- `useCast.ts` ligne 304 (web path)

La majorite des flux radio de Radio Browser sont en HTTP. En forcant HTTPS, on envoie une URL qui ne repond pas ou renvoie une erreur SSL. Le receiver affiche les metadonnees (titre, logo) car elles sont dans l'objet `MediaInfo`, mais le player interne echoue silencieusement a charger le flux audio.

**Pourquoi ca marchait avant avec le Default Media Receiver (CC1AD845)** : le DMR a une exemption speciale de Google pour le contenu mixte. Ton receiver custom (`65257ADB`) n'a pas cette exemption, MAIS il est heberge en HTTPS — donc il ne peut pas non plus charger du HTTP brut. La solution est de **ne pas forcer HTTPS** et de configurer le receiver custom pour accepter le contenu tel quel (le Chromecast lui-meme n'a pas la restriction mixed-content du navigateur, c'est le receiver web qui l'impose).

### Probleme 2 : Playlists non resolues — CONFIRME

`RadioBrowserService.java` a deja toute la logique de resolution (`resolveStreamUrl`, `followRedirects`, `parseM3uPlaylist`, `parsePlsPlaylist`). Mais `CastPlugin.java` envoie l'URL brute au Chromecast. Les Chromecast ne savent pas parser les fichiers `.m3u` ou `.pls`.

### Probleme 3 : MIME type generique — MINEUR mais a corriger

`audio/*` est theoriquement valide mais certains receivers sont plus stricts. On peut detecter le type depuis l'URL resolue.

### Incoherence App ID dans le ps1

Le ps1 (le fichier effectivement deploye) utilise correctement `65257ADB` pour le receiver custom, tant dans `CastPlugin` que `CastOptionsProvider`. Les fichiers standalone dans `android-auto/` utilisent le DMR — ils sont desynchronises mais ne sont pas deployes.

---

## Plan de correction

### 1. CastPlugin.java — Ajouter resolution de flux + supprimer forcage HTTPS

- **Supprimer** la ligne `String castUrl = u.startsWith("http://") ? u.replace("http://", "https://") : u;`
- **Ajouter** une methode `resolveStreamUrl` dans CastPlugin (adaptee de RadioBrowserService) : suivre les redirections, parser `.m3u`/`.pls`, retourner l'URL directe du flux audio
- **Detecter le MIME type** depuis l'URL resolue (`audio/mpeg` pour .mp3, `audio/aac` pour .aac, `audio/ogg` pour .ogg, `audio/aacp` pour .aac+, sinon `audio/mpeg` par defaut)
- Appeler `resolveStreamUrl` dans `loadMedia` avant d'envoyer au Chromecast
- La resolution doit etre asynchrone (sur un thread separe) pour ne pas bloquer l'UI thread

### 2. Receiver HTML (public/ + docs/) — Supprimer forcage HTTPS

- **Supprimer** les lignes qui forcent `http://` → `https://` dans l'intercepteur LOAD (lignes 405-411)
- Garder tout le reste : UI, PlaybackConfig, error listener

### 3. useCast.ts — Supprimer forcage HTTPS cote web

- **Supprimer** le `.replace('http://', 'https://')` sur `streamUrlSafe` (ligne 304)
- Garder `streamType = LIVE` et `contentType = "audio/*"`

### 4. radiosphere_v1_2_1.ps1 — Miroir de tous les changements

- Mettre a jour le template inline de `CastPlugin.java` pour inclure la resolution de flux et supprimer le forcage HTTPS
- Le template est compact (1 ligne par methode), donc la resolution sera ajoutee en tant que methodes utilitaires dans la meme classe

### Fichiers modifies
- `android-auto/CastPlugin.java` — resolution flux + suppression HTTPS forcing
- `public/cast-receiver.html` — suppression HTTPS forcing dans intercepteur
- `docs/receiver.html` — miroir du receiver
- `src/hooks/useCast.ts` — suppression HTTPS forcing web
- `radiosphere_v1_2_1.ps1` — miroir CastPlugin inline




## Investigation : Pas de son sur le Chromecast avec receiver personnalise

### Cause identifiee

Le probleme vient de la combinaison de deux facteurs :

1. **Contenu mixte (HTTP bloque)** : Le receiver personnalise est heberge en HTTPS (obligation Google). Les flux radio sont souvent en HTTP. Le navigateur Chrome embarque sur le Chromecast **bloque les requetes HTTP** depuis un contexte HTTPS (mixed content). Le Default Media Receiver (CC1AD845) a une exemption speciale pour ca — mais un receiver custom, non.

2. **Pas de configuration de lecture adaptee aux flux live** : Le receiver fait `context.start()` sans `PlaybackConfig`. Pour les streams live audio, il faut configurer `autoResumeDuration` et potentiellement un `segmentRequestHandler` pour gerer les redirections HTTP.

### Ce que le code natif fait bien

Dans `CastPlugin.java` (ligne 324-328), le `loadMedia` envoie correctement :
- `STREAM_TYPE_LIVE` 
- `contentType("audio/*")`
- `autoplay(true)`

Les metadonnees arrivent donc bien au receiver (d'ou le titre et le logo affiches). Mais le player interne du receiver ne parvient pas a lire le flux audio.

### Correctifs a appliquer

**Fichier 1 : `public/cast-receiver.html`** (et `docs/receiver.html` en miroir)

Dans l'intercepteur LOAD (ligne 391-427), ajouter :
- Forcer le remplacement `http://` → `https://` sur l'URL du stream (beaucoup de stations radio supportent HTTPS mais ne l'annoncent pas)
- Configurer le `PlaybackConfig` avec `autoResumeDuration` pour les streams live
- Ajouter un listener d'erreur media pour le diagnostic

```js
// Avant context.start(), configurer la lecture
const playbackConfig = new cast.framework.PlaybackConfig();
playbackConfig.autoResumeDuration = 5;
playbackConfig.initialBandwidth = 128000; // Bitrate typique radio

// Dans l'intercepteur LOAD :
// Forcer HTTPS sur l'URL du stream
if (media.contentId && media.contentId.startsWith('http://')) {
  media.contentId = media.contentId.replace('http://', 'https://');
}
// Idem pour contentUrl si present
if (media.contentUrl && media.contentUrl.startsWith('http://')) {
  media.contentUrl = media.contentUrl.replace('http://', 'https://');
}

// Ecouter les erreurs media pour diagnostic
playerManager.addEventListener(
  cast.framework.events.EventType.ERROR,
  (event) => { console.error('[RS Receiver] Error:', JSON.stringify(event)); }
);

// Demarrer avec la config
context.start({ playbackConfig });
```

**Fichier 2 : `android-auto/CastPlugin.java`** (ligne 322)

Forcer HTTPS sur le streamUrl avant envoi au Chromecast, car meme si le receiver tente la conversion, autant l'envoyer proprement :

```java
String castUrl = streamUrl.startsWith("http://") 
    ? streamUrl.replace("http://", "https://") 
    : streamUrl;
```

**Fichier 3 : `src/hooks/useCast.ts`** (web path, ligne 303)

Meme correction cote web sender — forcer HTTPS et ajouter `streamType = LIVE` :

```ts
const streamUrlSafe = station.streamUrl.replace('http://', 'https://');
const mediaInfo = new chr.cast.media.MediaInfo(streamUrlSafe, "audio/*");
mediaInfo.streamType = chr.cast.media.StreamType.LIVE;
```

### Fichiers modifies
- `public/cast-receiver.html` : PlaybackConfig + force HTTPS + error listener
- `docs/receiver.html` : miroir identique
- `android-auto/CastPlugin.java` : force HTTPS sur streamUrl
- `src/hooks/useCast.ts` : force HTTPS + streamType LIVE + contentType audio/*

### Note importante

Si certaines stations n'ont vraiment pas de certificat HTTPS (le HTTPS echoue), le flux ne pourra pas etre caste avec un receiver custom. C'est une limitation de la plateforme Google Cast. Le Default Media Receiver (CC1AD845) est le seul a avoir une exemption pour le contenu mixte.


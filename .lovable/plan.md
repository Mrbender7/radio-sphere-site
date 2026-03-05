

## Diagnostic : Image "collante" dans la notification

### Problème identifié

Le bug se situe dans le script `radiosphere_v2_4_8.ps1`. Le fichier source `android-auto/MediaPlaybackService.java` contient bien le correctif (reset du cache quand une station n'a pas de logo), mais le **ps1 ne l'a pas** :

**Dans le ps1 (ligne ~473-480) — code actuel :**
```java
if (!logo.isEmpty() && !logo.equals(cachedLogoUrl)) {
    cachedLogoUrl = logo;
    new Thread(() -> {
        cachedArtwork = downloadBitmap(finalLogo);
        updateSessionAndNotification(finalName, finalIsPlaying, cachedArtwork);
    }).start();
}
// ← manque le else if (logo.isEmpty()) { reset cache }
updateSessionAndNotification(name, isPlaying, cachedArtwork);
```

**Dans `MediaPlaybackService.java` (correct) :**
```java
if (!logo.isEmpty() && !logo.equals(cachedLogoUrl)) {
    ...
} else if (logo.isEmpty()) {
    cachedLogoUrl = "";
    cachedArtwork = null;   // ← reset propre
}
```

Sans ce `else if`, quand une station sans logo est jouée, `cachedArtwork` garde le bitmap de la station précédente et la notification affiche l'ancienne image.

### Correction

**Fichier : `radiosphere_v2_4_8.ps1`**
- Ajouter le bloc `else if (logo.isEmpty())` manquant après le `if (!logo.isEmpty() && ...)` dans la section `MediaPlaybackService` du ps1, identique à ce qui existe déjà dans `android-auto/MediaPlaybackService.java`

C'est une correction d'une seule ligne manquante dans le ps1 — aucun autre fichier n'est impacté. Les composants UI web (MiniPlayer, FullScreenPlayer, StationCard) gèrent déjà correctement le cas logo vide avec le placeholder.


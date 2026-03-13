

## Plan : Cast Audio Fix v2.5.4 — TERMINÉ ✅

### Diagnostic
Le son ne passait pas sur le Chromecast pour 3 raisons :
1. **Forçage HTTPS** cassait les flux HTTP-only (cause principale)
2. **Playlists .m3u/.pls** non résolues avant envoi au Chromecast
3. **MIME type générique** `audio/*` pouvait être rejeté par certains receivers

### Corrections appliquées

| Fichier | Action |
|---------|--------|
| `android-auto/CastPlugin.java` | v2.5.4: Suppression forçage HTTPS, ajout `resolveStreamUrl` (redirects + .m3u/.pls), détection MIME, résolution async avec timeout 8s |
| `public/cast-receiver.html` | v2.5.4: Suppression forçage HTTPS dans intercepteur LOAD |
| `docs/receiver.html` | v2.5.4: Miroir du receiver |
| `src/hooks/useCast.ts` | v2.5.4: Suppression `.replace('http://', 'https://')` côté web |
| `radiosphere_v1_2_1.ps1` | v2.5.4: Template CastPlugin inline mis à jour avec résolution de flux + MIME |

### Architecture résolution de flux (CastPlugin)
- `resolveStreamUrlSafely()` → timeout 8s, fallback URL brute
- `resolveStreamUrl()` → `followRedirects()` (5 max) + HEAD pour Content-Type + parse M3U/PLS
- `detectMimeType()` → `audio/mpeg`, `audio/aac`, `audio/ogg`, `application/x-mpegurl`
- Logo images restent forcées en HTTPS (affichage seulement)

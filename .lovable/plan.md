

# Optimisations Android APK : Mixed Content, Bluetooth, Performance et WebView

## Vue d'ensemble

Ce plan couvre 4 axes d'amelioration pour la stabilite de l'APK Capacitor sur Android. Certaines modifications se font cote code web (Lovable), d'autres necessitent des fichiers natifs Android qui ne sont pas editables dans Lovable mais pour lesquels je fournirai les instructions exactes.

---

## 1. Mixed Content -- Autoriser le contenu HTTP dans la WebView

**Probleme** : La WebView Capacitor tourne en HTTPS mais certains logos de stations sont servis en HTTP, ce qui les bloque.

**Solution cote code (Lovable)** :
- Dans `StationCard.tsx` : forcer la conversion `http://` vers `https://` sur toutes les URLs de logos avant le rendu des balises `<img>`.
- Dans `MiniPlayer.tsx` et `FullScreenPlayer.tsx` : meme traitement sur `currentStation.logo`.
- Cela couvre le cote front-end. Le `PlayerContext.tsx` fait deja cette conversion pour le MediaSession.

**Solution cote natif (instructions manuelles)** :
- L'option `allowMixedContent` n'existe pas dans `capacitor.config.json`. Il faut modifier le fichier natif `android/app/src/main/java/.../MainActivity.java` pour ajouter `webView.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW)`. Je fournirai les instructions exactes a copier apres la generation de l'APK.

---

## 2. Permissions Bluetooth (API 31+)

**Probleme** : Sur Android 12+, `BLUETOOTH_CONNECT` est requis pour l'audio via casques Bluetooth.

**Solution** : Ce changement est **100% natif** (fichier `AndroidManifest.xml`). Il ne peut pas etre fait dans Lovable.

**Instructions manuelles** : Apres `npx cap add android`, ajouter dans `android/app/src/main/AndroidManifest.xml` :
```xml
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
```

La demande de permission runtime sera geree par le systeme Android automatiquement quand l'utilisateur connectera un appareil Bluetooth.

---

## 3. Optimisation des performances (reduction du jank)

**Probleme** : Les logs "Davey!" indiquent des blocages du thread principal lors du rendu initial.

**Solutions cote code (Lovable)** :
- **Lazy loading des images** : Ajouter `loading="lazy"` sur toutes les balises `<img>` dans `StationCard.tsx`, `MiniPlayer.tsx`, et `FullScreenPlayer.tsx`.
- **Placeholder skeleton** : Afficher des skeletons pendant le chargement des stations au lieu d'un simple spinner, pour eviter le layout shift.
- **Stale time** : Le `staleTime` de 5 minutes est deja en place dans `HomePage.tsx`, ce qui est correct.

Fichiers modifies :
- `src/components/StationCard.tsx` -- ajout `loading="lazy"` sur les `<img>`
- `src/components/MiniPlayer.tsx` -- ajout `loading="lazy"`
- `src/components/FullScreenPlayer.tsx` -- ajout `loading="lazy"`
- `src/pages/HomePage.tsx` -- remplacer le spinner par des skeleton cards

---

## 4. Configuration WebView / CapacitorCookies / CapacitorHttp

**Probleme** : Warnings "Seed missing" et methodes de stockage deprecees.

**Solution** : Ces warnings proviennent du runtime Android natif (Chromium WebView) et ne sont **pas controlables depuis le code web**. Ils sont inoffensifs et n'affectent pas le fonctionnement de l'app. Les plugins `CapacitorCookies` et `CapacitorHttp` ne sont pas utilises dans cette app (les appels reseau passent par `fetch` standard), donc aucune action n'est necessaire.

---

## Resume des modifications Lovable

| Fichier | Modification |
|---|---|
| `src/components/StationCard.tsx` | Forcer HTTPS sur logos + `loading="lazy"` |
| `src/components/MiniPlayer.tsx` | Forcer HTTPS sur logo + `loading="lazy"` |
| `src/components/FullScreenPlayer.tsx` | Forcer HTTPS sur logo + `loading="lazy"` |
| `src/pages/HomePage.tsx` | Skeleton placeholders au lieu du spinner |

## Instructions natives (post-build, hors Lovable)

1. **Mixed Content** : Modifier `MainActivity.java` pour `setMixedContentMode`
2. **Bluetooth** : Ajouter `BLUETOOTH_CONNECT` dans `AndroidManifest.xml`
3. **WebView warnings** : Aucune action requise (warnings inoffensifs)


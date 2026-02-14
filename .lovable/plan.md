

# Audit complet Android + Corrections + Workflow

## Resultat de l'audit

### Ce qui fonctionne bien
- Moteur audio HTML5 avec heartbeat, silent loop, WakeLock -- solide
- Foreground Service avec `silent: true` -- OK
- Media Session API (play/pause depuis la notification) -- OK
- Gestion des favoris, recents, recherche -- OK
- Favicons et icones PWA -- OK
- Overlay station active (sans hover) -- OK

### Problemes detectes

**1. Bouton Retour : logique incorrecte sur les onglets non-home**

Actuellement dans `Index.tsx` :
```
useBackButton({
  onBack: closeFullScreen,    // <-- probleme
  onDoubleBackHome: () => setShowExitDialog(true),
  isHome: activeTab === "home",
  isFullScreen,
});
```

Dans `useBackButton.ts`, quand `isFullScreen = false` et `isHome = false`, le code appelle `onBack()` qui fait `closeFullScreen()` -- ce qui ne fait rien. Le bouton retour est donc inoperant sur les onglets Search, Library et Settings.

**Correction** : `onBack` doit naviguer vers l'onglet Home quand le fullscreen player n'est pas ouvert.

**2. Fullscreen Player : le back ramene a home au lieu de rester sur l'onglet courant**

Quand le fullscreen player est ouvert depuis l'onglet Search et qu'on appuie sur back, le comportement actuel ferme le fullscreen -- c'est correct. Mais il faut s'assurer que l'onglet actif reste le meme (Search), pas Home.

Actuellement `onBack: closeFullScreen` -- c'est correct pour le fullscreen car `closeFullScreen` ne change pas l'onglet actif. OK.

**3. Requestfullscreen sur premier clic (App.tsx lignes 28-36)**

Le code tente de passer en plein ecran navigateur au premier clic. Sur Android Capacitor/WebView, cela peut provoquer des comportements inattendus (barre de navigation systeme cachee, gestes brises). Ce n'est pas necessaire car Capacitor gere deja le mode immersif via le manifest Android.

**Correction** : Supprimer le `requestFullscreen` automatique.

**4. References iOS inutiles (index.html)**

`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon` -- inutiles pour une app exclusivement Android. Nettoyage optionnel mais recommande.

**5. GenreCard : `hover:` classes inutiles sur Android**

`hover:shadow-xl hover:-translate-y-0.5` sur les cartes de genre -- pas de hover sur mobile, mais inoffensif. Nettoyage optionnel.

## Plan de corrections

### Etape 1 : Corriger le bouton Retour (`useBackButton` + `Index.tsx`)

Modifier `Index.tsx` pour passer la bonne logique :
- `onBack` : si fullscreen ouvert -> fermer fullscreen ; sinon -> naviguer vers l'onglet Home
- Le hook gere deja la priorite fullscreen > home > default

Concretement, changer `onBack` dans `Index.tsx` :
```typescript
useBackButton({
  onBack: () => {
    if (isFullScreen) {
      closeFullScreen();
    } else {
      setActiveTab("home");
    }
  },
  onDoubleBackHome: () => setShowExitDialog(true),
  isHome: activeTab === "home",
  isFullScreen,
});
```

Et simplifier `useBackButton.ts` pour que le hook ne duplique plus la logique fullscreen (le callback `onBack` s'en charge) :
```typescript
const handleBackPress = useCallback(() => {
  if (isHome) {
    // double-back logic...
    return;
  }
  onBack();
}, [isHome, onBack, onDoubleBackHome]);
```

### Etape 2 : Supprimer le requestFullscreen automatique (`App.tsx`)

Retirer les lignes 27-36 qui tentent `document.documentElement.requestFullscreen()` au premier clic. Inutile et potentiellement problematique sur Capacitor Android.

### Etape 3 : Nettoyer les references iOS (`index.html`)

Supprimer `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, et `apple-touch-icon` du HTML.

### Etape 4 : Supprimer les hover sur GenreCard (`HomePage.tsx`)

Retirer `hover:shadow-xl hover:-translate-y-0.5` des cartes de genre.

---

## Workflow complet APK avec icone de notification

Voici le workflow complet pour generer l'APK avec l'icone de notification fonctionnelle :

### Prerequis
- Android Studio installe
- Le projet exporte sur GitHub et clone localement
- Node.js installe

### Etape 1 : Preparer l'icone de notification

L'icone de notification Android **doit etre monochrome** (blanc sur transparent). Le "New Image Asset" d'Android Studio genere des icones adaptives (colorees, avec arriere-plan) -- celles-ci ne fonctionnent **PAS** pour les notifications.

Pour creer l'icone de notification correctement :

1. Ouvrir Android Studio
2. **Ne pas utiliser** "Image Asset" classique (Adaptive/Legacy)
3. Aller dans `File > New > Image Asset`
4. Choisir **Icon Type: "Notification Icons"** (pas "Launcher Icons")
5. Charger ton logo Radio Sphere
6. Android Studio va automatiquement le convertir en silhouette blanche sur fond transparent
7. Nommer l'icone : `ic_notification`
8. Cliquer sur Finish

Cela va generer les fichiers dans :
```
android/app/src/main/res/drawable-mdpi/ic_notification.png
android/app/src/main/res/drawable-hdpi/ic_notification.png
android/app/src/main/res/drawable-xhdpi/ic_notification.png
android/app/src/main/res/drawable-xxhdpi/ic_notification.png
```

**Si "Notification Icons" n'apparait pas** dans le menu, creer manuellement :
1. Prendre ton logo
2. Le convertir en blanc pur (#FFFFFF) sur fond transparent dans un editeur d'image (GIMP, Photoshop, etc.)
3. Exporter en PNG aux tailles : 24x24, 36x36, 48x48, 72x72
4. Placer dans les dossiers `drawable-*` ci-dessus

### Etape 2 : Build et deploiement

```powershell
# 1. Pull les dernieres modifications
git pull

# 2. Installer les dependances
npm install

# 3. Build web
npm run build

# 4. Synchroniser avec Capacitor
npx cap sync android

# 5. IMPORTANT : Copier l'icone de notification (si creee manuellement)
#    Verifier que ic_notification.png existe dans les dossiers drawable-*

# 6. Ouvrir dans Android Studio
npx cap open android

# 7. Dans Android Studio :
#    - Build > Build Bundle(s) / APK(s) > Build APK(s)
#    - Ou Run sur un appareil/emulateur
```

### Etape 3 : Verifications post-build

- Lancer une station radio
- Verifier que la notification apparait **sans son**
- Verifier que l'icone dans la barre de notification est bien la silhouette blanche
- Appuyer sur back dans le fullscreen player -> doit revenir a l'onglet precedent
- Appuyer sur back sur un onglet non-home -> doit revenir a Home
- Double-clic back sur Home -> dialogue de confirmation de sortie

### Point important : Canal de notification silencieux

Si malgre `silent: true` la notification fait du bruit, ajouter dans `MainActivity.java` (dans `onCreate`, apres `super.onCreate`) :

```java
if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
    android.app.NotificationChannel channel = new android.app.NotificationChannel(
        "foreground_service",
        "Radio Playback",
        android.app.NotificationManager.IMPORTANCE_LOW
    );
    channel.setSound(null, null);
    channel.enableVibration(false);
    android.app.NotificationManager nm = getSystemService(android.app.NotificationManager.class);
    if (nm != null) nm.createNotificationChannel(channel);
}
```




# Corrections Android : Bouton notification, icone, lockscreen

## Diagnostic

### 1. Bouton Play/Pause dans la notification NE FONCTIONNE PAS
La documentation officielle du plugin `@capawesome-team/capacitor-android-foreground-service` indique clairement :

> `addListener('buttonClicked', ...)` — **Only available on iOS.**

Le code actuel enregistre ce listener (ligne 239 de PlayerContext.tsx) mais il ne sera jamais appele sur Android. Les boutons s'affichent visuellement dans la notification mais les clics ne sont pas transmis au JavaScript.

**Solution** : Supprimer les `buttons` du foreground service (inutiles sur Android) et s'appuyer sur la **Media Session API** du systeme. Quand la Media Session est correctement configuree ET qu'un foreground service tourne, Android affiche automatiquement des controles play/pause dans la notification et sur le lockscreen, en utilisant les handlers `mediaSession.setActionHandler('play'/'pause')` deja en place.

### 2. Icone de notification coloree
Le script PowerShell copie `ic_launcher.png` (colore) vers `ic_notification.png`. C'est un fallback pour eviter les crashs. Ta procedure dans Android Studio est correcte :
- Clic droit sur `app` > New > Image Asset > **Notification Icons**
- Nommer `ic_notification`
- Android Studio genere des PNG monochrome blancs dans les dossiers `drawable-*`
- Ces fichiers ecrasent les fallback du script

Le manifest n'a aucun impact sur l'icone — c'est uniquement la propriete `smallIcon: 'ic_notification'` dans le code JS qui reference le drawable.

### 3. Lockscreen intermittent
Deux causes possibles :
- `importance: 2` (LOW) peut ne pas s'afficher sur le lockscreen selon les surcouches constructeur. Passer a `importance: 3` (DEFAULT) avec `sound: undefined` pour garantir la visibilite tout en restant silencieux.
- Sans Media Session active cote systeme, Android n'a pas de raison d'afficher des controles multimedia sur le lockscreen. La Media Session doit etre la source principale des controles.

---

## Plan de corrections

### Fichier : `src/contexts/PlayerContext.tsx`

**A. Modifier le canal de notification**
Passer l'importance de 2 (LOW) a 3 (DEFAULT) pour garantir la visibilite sur le lockscreen, tout en gardant `sound: undefined` et `vibration: false` pour le silence :

```typescript
await ForegroundService.createNotificationChannel({
  id: NOTIFICATION_CHANNEL_ID,
  name: 'Radio Playback',
  importance: 3, // DEFAULT — visible lockscreen, pas de son car sound: undefined
  sound: undefined,
  vibration: false,
});
```

**IMPORTANT** : Si tu as deja installe l'app avec `importance: 2`, il faut desinstaller puis reinstaller l'APK. Android ne met pas a jour les canaux de notification existants.

**B. Supprimer les `buttons` du foreground service**
Les boutons ne fonctionnent pas sur Android. Les retirer de `startForegroundService` et `updateNativeForegroundService` :

```typescript
await ForegroundService.startForegroundService({
  id: 1,
  title: station.name,
  body: station.country || 'Radio Sphere',
  smallIcon: 'ic_notification',
  serviceType: 2,
  silent: true,
  notificationChannelId: NOTIFICATION_CHANNEL_ID,
  // PAS de buttons — inutile sur Android
});
```

**C. Supprimer le listener `buttonClicked`**
Retirer entierement le bloc async qui enregistre le listener `buttonClicked` (lignes 236-248), car il est iOS-only et ne fait qu'ajouter du code mort.

**D. S'assurer que la Media Session est correctement alimentee**
Les handlers `play`/`pause` de la Media Session (deja en place lignes 202-226) sont la seule source de controles sur Android. Le systeme les utilise pour afficher les boutons play/pause dans la notification media et sur le lockscreen. Pas de changement necessaire ici, ils sont deja corrects.

### Fichier : `radiosphere_v2_2_3.ps1` (mise a jour vers v2.2.4)

Pas de changement structurel necessaire. Le script reste fonctionnel. Seul le numero de version et le message de fin seront mis a jour pour refleter les corrections.

---

## Workflow APK final complet

### Etape 1 : Publier les corrections depuis Lovable
Apres approbation de ce plan, les modifications seront appliquees au code.

### Etape 2 : Lancer le script PowerShell
```powershell
.\radiosphere_v2_2_4.ps1
```
Le script clone, installe, build, ajoute Android, patch le manifest et sync.

### Etape 3 : Icone de notification dans Android Studio
1. Ouvrir le projet : `npx cap open android`
2. Dans le panneau Project (vue "Android"), clic droit sur **app**
3. **New > Image Asset**
4. En haut, dans **Icon Type**, selectionner **"Notification Icons"**
5. **Name** : `ic_notification` (exactement ce nom)
6. **Asset Type** : choisir "Clip Art" et selectionner l'icone radio, OU "Image" et charger ton logo
7. Android Studio convertit automatiquement en silhouette blanche sur fond transparent
8. Cliquer **Next** puis **Finish**
9. Les fichiers dans `drawable-mdpi/hdpi/xhdpi/xxhdpi/` seront ecrases par les versions monochrome correctes

### Etape 4 : DESINSTALLER l'ancienne APK
**Obligatoire** car Android ne met pas a jour les canaux de notification existants. Desinstaller l'app depuis le telephone avant d'installer la nouvelle version.

### Etape 5 : Build et installer
Dans Android Studio : **Build > Build Bundle(s) / APK(s) > Build APK(s)**, puis installer sur le telephone.

### Etape 6 : Verifications
- Lancer une station : la notification doit apparaitre **sans son**
- L'icone dans la barre de statut doit etre la silhouette blanche (pas le logo colore)
- Les controles **play/pause systeme** doivent apparaitre dans la notification (geres par Media Session, pas par les boutons du plugin)
- Sur l'ecran de verrouillage, la notification media avec controles doit etre visible
- Bouton retour : fullscreen > ferme le player, onglet > retour home, home > double-tap exit


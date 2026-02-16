

# Corrections Android : Son notification, Bouton retour, Ecran de verrouillage

## 3 problemes identifies et leurs causes

### 1. Son de notification persistant
**Cause** : Le plugin capawesome utilise par defaut son propre canal de notification (pas celui cree dans MainActivity.java). Le canal "foreground_service" cree en Java n'est jamais utilise par le plugin car le code JS ne passe pas `notificationChannelId`.

**Solution** : Utiliser l'API JS du plugin pour creer le canal silencieux directement, puis passer `notificationChannelId` a chaque appel `startForegroundService`. Cela garantit que le plugin utilise bien le bon canal.

```typescript
// Creer le canal silencieux au demarrage via le plugin lui-meme
ForegroundService.createNotificationChannel({
  id: 'radio_silent',
  name: 'Radio Playback',
  importance: 2, // LOW
});

// Puis a chaque start :
ForegroundService.startForegroundService({
  ...
  notificationChannelId: 'radio_silent',
});
```

### 2. Bouton retour ferme l'app depuis tous les ecrans
**Cause** : Le hook `useBackButton` utilise l'evenement `popstate` du navigateur, qui ne fonctionne pas correctement dans une WebView Capacitor Android. Le bouton retour hardware Android ne declenche pas toujours `popstate` de maniere fiable, et quand il le fait, il peut provoquer une navigation reelle (sortie de l'app) avant que le handler puisse l'intercepter.

**Solution** : Utiliser le plugin `@capacitor/app` qui fournit un evenement `backButton` natif specifique a Android. Quand on ecoute cet evenement, le comportement par defaut du bouton retour est desactive, ce qui donne un controle total.

```typescript
import { App } from '@capacitor/app';

App.addListener('backButton', () => {
  // Logique custom : fullscreen -> fermer, onglet -> home, home -> double-tap exit
});
```

Le hook gardera aussi le fallback `popstate` pour le web/preview.

### 3. Pas de controles sur l'ecran de verrouillage
**Cause** : La Media Session API dans une WebView Android ne propage pas les controles vers l'ecran de verrouillage systeme. C'est une limitation connue de WebView. Le seul moyen d'afficher des controles sur l'ecran de verrouillage est via la notification du foreground service, qui elle s'affiche bien sur le lock screen.

**Solution** : La notification du foreground service devrait deja apparaitre sur l'ecran de verrouillage si le canal a une importance suffisante (LOW minimum, pas MIN). Le probleme actuel est que le canal n'est pas correctement utilise (probleme 1). Une fois le canal corrige avec `IMPORTANCE_LOW` et `notificationChannelId` correctement passe, la notification avec le bouton Play/Pause apparaitra sur le lock screen.

De plus, augmenter les infos dans la notification (ajouter le logo de la station via la propriete `largeIcon` si le plugin le supporte).

---

## Plan technique

### Fichier 1 : `src/contexts/PlayerContext.tsx`

**Modifications :**

- Ajouter une fonction `ensureNotificationChannel()` qui cree le canal silencieux via `ForegroundService.createNotificationChannel()` au lieu de le faire en Java
- Passer `notificationChannelId: 'radio_silent'` dans tous les appels `startForegroundService`
- Appeler `ensureNotificationChannel()` une fois au montage du provider

### Fichier 2 : `src/hooks/useBackButton.ts`

**Modifications :**

- Importer dynamiquement `@capacitor/app` (App plugin)
- Utiliser `App.addListener('backButton', ...)` comme handler principal sur Android
- Garder le fallback `popstate` pour le web
- La logique interne reste la meme : fullscreen > retour home > double-tap exit

### Fichier 3 : `radiosphere_v2_2_2.ps1`

**Modifications :**

- Supprimer le patch Java `onCreate` pour le canal de notification (desormais gere cote JS)
- Garder le patch `onResume` pour WebView settings (mixed content + autoplay)
- Le canal etant cree par le plugin JS, plus besoin du code Java

### Fichier 4 : `package.json` (dependance)

**Ajout :**

- `@capacitor/app` est necessaire pour le listener `backButton`. Il doit etre ajoute aux dependances et au script PowerShell.


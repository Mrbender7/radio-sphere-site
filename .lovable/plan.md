

# Suppression du badge de notification sur l'icone de l'app

## Probleme

Le foreground service cree une notification qui genere un badge (compteur) sur l'icone de l'app Android, donnant l'impression qu'il y a des messages non lus.

## Diagnostic

Le plugin capawesome `createNotificationChannel` ne supporte pas l'option `showBadge`. Il faut donc creer le canal de notification **nativement** dans `MainActivity.java` avec `setShowBadge(false)` **avant** que le plugin JS ne le cree. Android ne recree pas un canal qui existe deja, donc le canal natif (sans badge) sera utilise.

## Solution en 2 parties

### 1. Patch natif dans le script PowerShell (`radiosphere_v2_2_4.ps1`)

Ajouter dans le patch `MainActivity.java` une methode `onCreate` qui cree le canal `radio_playback_v2` nativement avec `setShowBadge(false)` :

```text
onCreate() {
  super.onCreate(savedInstanceState);
  // Creer le canal avec showBadge = false
  NotificationChannel channel = new NotificationChannel(
    "radio_playback_v2",
    "Radio Playback",
    NotificationManager.IMPORTANCE_LOW
  );
  channel.setShowBadge(false);
  channel.setDescription("Notification silencieuse pour la lecture radio");
  notificationManager.createNotificationChannel(channel);
}
```

### 2. Nouveau canal ID (`src/contexts/PlayerContext.tsx`)

Changer le `NOTIFICATION_CHANNEL_ID` de `radio_playback_v2` a `radio_playback_v3` pour forcer Android a creer un nouveau canal avec les bons parametres (puisque l'ancien `v2` est deja en cache sans `showBadge(false)`).

## Fichiers modifies

- `radiosphere_v2_2_4.ps1` : ajout du patch `onCreate` dans `MainActivity.java` pour creer le canal nativement sans badge
- `src/contexts/PlayerContext.tsx` : changement de l'ID du canal en `radio_playback_v3`

## Note importante

Apres le build, il faudra desinstaller l'ancienne APK pour que l'ancien canal `v2` soit supprime.


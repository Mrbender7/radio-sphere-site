

## Plan: Fix Android Auto foreground service + update PS1

### Problem
`RadioBrowserService` never promotes itself to a foreground service during playback. Android 14+ blocks `requestAudioFocus()` for non-foreground services, so no station plays.

### Changes

#### 1. `android-auto/AndroidManifest-snippet.xml`
- Add `android:foregroundServiceType="mediaPlayback"` to the `RadioBrowserService` `<service>` declaration (line 48-57)

#### 2. `android-auto/RadioBrowserService.java`
- Add imports: `NotificationChannel`, `NotificationManager`, `Notification`, `PendingIntent`, `NotificationCompat`, `MediaStyle`
- Add constants: `CHANNEL_ID = "radio_auto_playback"`, `NOTIFICATION_ID = 3001`
- In `onCreate()`: create `NotificationChannel` (IMPORTANCE_LOW, no badge, no vibration)
- New method `startAsForeground(String stationName, boolean isPlaying)`: builds a `MediaStyle` notification with the MediaSession token, play/pause action, and calls `startForeground()`
- In `playStation()`: call `startAsForeground()` **before** `requestAudioFocus()` so the service is already foreground when audio focus is requested
- In `onStop()` callback: call `stopForeground(false)` before `stopSelf()`-like cleanup
- Update notification on state changes (playing/paused) via `startAsForeground()` in `updatePlaybackState()`
- Change `followRedirects()` to use `HEAD` instead of `GET`, with fallback to `GET` if the server returns an error
- Add `onPrepare()` to the MediaSession callback (calls `onPlay()`)

#### 3. `radiosphere_v2_5_0.ps1`
- Update the manifest injection block (line 181-190): add `android:foregroundServiceType="mediaPlayback"` to RadioBrowserService
- Replace the entire embedded `RadioBrowserService.java` (lines 718-1286) with the updated version matching the changes above
- Update the version label from `v2.4.8` to `v2.5.0` in the generation log messages
- Add a new line in the final summary about the foreground service fix for Android 14+
- Add `NotificationChannel` creation for `radio_auto_playback` in the `MainActivity` patch (alongside the existing `radio_playback_v3` channel)

### Technical Details

The foreground notification reuses the same `MediaStyle` pattern as `MediaPlaybackService` but with a distinct channel ID (`radio_auto_playback`) and notification ID (`3001`) to avoid conflicts. The notification displays the station name, a play/pause toggle, and is linked to the MediaSession token so Android Auto's UI stays in sync.

The `followRedirects` change from `GET` to `HEAD` prevents the server from streaming audio data during redirect resolution, which wastes bandwidth and can cause timeouts on slow connections.


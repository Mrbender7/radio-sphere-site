package com.fhm.radiosphere;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.mediarouter.media.MediaRouteSelector;
import androidx.mediarouter.media.MediaRouter;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.android.gms.cast.CastMediaControlIntent;
import com.google.android.gms.cast.MediaInfo;
import com.google.android.gms.cast.MediaLoadRequestData;
import com.google.android.gms.cast.MediaMetadata;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.SessionManager;
import com.google.android.gms.cast.framework.SessionManagerListener;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;
import com.google.android.gms.common.images.WebImage;
import android.net.Uri;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * CastPlugin v2.5.4 — Capacitor plugin for native Chromecast integration.
 *
 * Key changes in v2.5.4:
 * - REMOVED forced HTTPS on stream URLs (was breaking HTTP-only radio streams)
 * - Added resolveStreamUrl: follows redirects, parses .m3u/.pls playlists
 * - MIME type detection from resolved URL (audio/mpeg, audio/aac, audio/ogg)
 * - Async stream resolution on background thread with 8s timeout
 */
@CapacitorPlugin(
    name = "CastPlugin",
    permissions = {
        @Permission(
            alias = "network",
            strings = {
                "android.permission.ACCESS_FINE_LOCATION",
                "android.permission.ACCESS_COARSE_LOCATION",
                "android.permission.NEARBY_WIFI_DEVICES"
            }
        )
    }
)
public class CastPlugin extends Plugin {

    private static final String TAG = "CastPlugin";
    private static final String CAST_APP_ID = CastMediaControlIntent.DEFAULT_MEDIA_RECEIVER_APPLICATION_ID;
    private static final String USER_AGENT = "RadioSphere/2.5";
    private static final int NETWORK_TIMEOUT_MS = 5000;
    private static final long RESOLVE_TIMEOUT_MS = 8000;

    private CastContext castContext;
    private MediaRouter mediaRouter;
    private MediaRouteSelector mediaRouteSelector;
    private boolean devicesAvailable = false;
    private PluginCall savedInitCall = null;
    private final ExecutorService streamResolverExecutor = Executors.newSingleThreadExecutor();

    // ─── Session listener ───────────────────────────────────────────
    private final SessionManagerListener<CastSession> sessionListener = new SessionManagerListener<CastSession>() {
        @Override public void onSessionStarting(@NonNull CastSession s) { Log.d(TAG, "Session starting..."); }
        @Override public void onSessionStarted(@NonNull CastSession session, @NonNull String id) {
            Log.d(TAG, "Session started: " + id);
            JSObject data = new JSObject();
            data.put("connected", true);
            data.put("deviceName", session.getCastDevice() != null ? session.getCastDevice().getFriendlyName() : "Chromecast");
            notifyListeners("castStateChanged", data);
            JSObject audioPause = new JSObject();
            audioPause.put("action", "pauseLocal");
            notifyListeners("localAudioControl", audioPause);
        }
        @Override public void onSessionStartFailed(@NonNull CastSession s, int err) {
            Log.e(TAG, "Session start failed, code=" + err + ", appId=" + CAST_APP_ID);
            JSObject data = new JSObject();
            data.put("connected", false);
            data.put("deviceName", "");
            data.put("errorCode", err);
            data.put("reason", "session_start_failed");
            notifyListeners("castStateChanged", data);
        }
        @Override public void onSessionEnding(@NonNull CastSession s) {}
        @Override public void onSessionEnded(@NonNull CastSession s, int err) {
            Log.d(TAG, "Session ended");
            JSObject data = new JSObject(); data.put("connected", false); data.put("deviceName", "");
            notifyListeners("castStateChanged", data);
            JSObject audioResume = new JSObject();
            audioResume.put("action", "resumeLocal");
            notifyListeners("localAudioControl", audioResume);
        }
        @Override public void onSessionResuming(@NonNull CastSession s, @NonNull String id) {}
        @Override public void onSessionResumed(@NonNull CastSession session, boolean wasSuspended) {
            Log.d(TAG, "Session resumed");
            JSObject data = new JSObject();
            data.put("connected", true);
            data.put("deviceName", session.getCastDevice() != null ? session.getCastDevice().getFriendlyName() : "Chromecast");
            notifyListeners("castStateChanged", data);
        }
        @Override public void onSessionResumeFailed(@NonNull CastSession s, int err) {}
        @Override public void onSessionSuspended(@NonNull CastSession s, int reason) {}
    };

    // ─── MediaRouter callback ───────────────────────────────────────
    private final MediaRouter.Callback mediaRouterCallback = new MediaRouter.Callback() {
        @Override public void onRouteAdded(@NonNull MediaRouter router, @NonNull MediaRouter.RouteInfo route) {
            Log.d(TAG, "Route added: " + route.getName());
            updateDeviceAvailability(router);
        }
        @Override public void onRouteRemoved(@NonNull MediaRouter router, @NonNull MediaRouter.RouteInfo route) {
            Log.d(TAG, "Route removed: " + route.getName());
            updateDeviceAvailability(router);
        }
        @Override public void onRouteChanged(@NonNull MediaRouter router, @NonNull MediaRouter.RouteInfo route) {
            updateDeviceAvailability(router);
        }
    };

    private void updateDeviceAvailability(MediaRouter router) {
        int totalRoutes = router.getRoutes().size();
        int matchingRoutes = 0;
        boolean hasDevices = false;

        for (MediaRouter.RouteInfo route : router.getRoutes()) {
            if (route.matchesSelector(mediaRouteSelector) && !route.isDefault()) {
                hasDevices = true;
                matchingRoutes++;
                Log.d(TAG, "  Cast-compatible route: " + route.getName() + " [" + route.getDescription() + "]");
            }
        }

        Log.d(TAG, "Scan details: Total routes=" + totalRoutes + ", matching=" + matchingRoutes + ", AppID=" + CAST_APP_ID);

        if (hasDevices != devicesAvailable) {
            devicesAvailable = hasDevices;
            Log.d(TAG, "Devices available changed: " + devicesAvailable);
            JSObject data = new JSObject(); data.put("available", devicesAvailable);
            notifyListeners("castDevicesAvailable", data);
        }
    }

    // ─── Permission helpers ─────────────────────────────────────────
    private boolean hasDiscoveryPermissions() {
        Context ctx = getContext();
        if (Build.VERSION.SDK_INT >= 33) {
            boolean nearby = ContextCompat.checkSelfPermission(ctx, "android.permission.NEARBY_WIFI_DEVICES") == PackageManager.PERMISSION_GRANTED;
            boolean fine = ContextCompat.checkSelfPermission(ctx, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
            return nearby && fine;
        }
        boolean fineGranted = ContextCompat.checkSelfPermission(ctx, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean coarseGranted = ContextCompat.checkSelfPermission(ctx, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        return fineGranted || coarseGranted;
    }

    @PluginMethod
    public void checkDiscoveryPermissions(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", hasDiscoveryPermissions());
        result.put("apiLevel", Build.VERSION.SDK_INT);
        call.resolve(result);
    }

    @PluginMethod
    public void requestDiscoveryPermissions(PluginCall call) {
        if (hasDiscoveryPermissions()) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }
        requestPermissionForAlias("network", call, "networkPermissionCallback");
    }

    @PermissionCallback
    private void networkPermissionCallback(PluginCall call) {
        boolean granted = hasDiscoveryPermissions();
        Log.d(TAG, "Network permission callback — granted: " + granted);
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);

        if (granted && savedInitCall != null) {
            PluginCall saved = savedInitCall;
            savedInitCall = null;
            doInitialize(saved);
        }
    }

    // ─── Initialize ─────────────────────────────────────────────────
    @PluginMethod
    public void initialize(PluginCall call) {
        if (!hasDiscoveryPermissions()) {
            Log.d(TAG, "initialize — permissions missing, requesting...");
            savedInitCall = call;
            requestPermissionForAlias("network", call, "networkPermissionCallback");
            return;
        }
        doInitialize(call);
    }

    private void doInitialize(PluginCall call) {
        try {
            getActivity().runOnUiThread(() -> {
                try {
                    Log.d(TAG, "Initializing Cast SDK with AppID: " + CAST_APP_ID);
                    castContext = CastContext.getSharedInstance(getContext());
                    SessionManager sm = castContext.getSessionManager();
                    sm.addSessionManagerListener(sessionListener, CastSession.class);

                    mediaRouteSelector = new MediaRouteSelector.Builder()
                        .addControlCategory(CastMediaControlIntent.categoryForCast(CAST_APP_ID))
                        .build();

                    mediaRouter = MediaRouter.getInstance(getContext());
                    mediaRouter.addCallback(mediaRouteSelector, mediaRouterCallback,
                        MediaRouter.CALLBACK_FLAG_REQUEST_DISCOVERY | MediaRouter.CALLBACK_FLAG_PERFORM_ACTIVE_SCAN);

                    updateDeviceAvailability(mediaRouter);

                    boolean permsOk = hasDiscoveryPermissions();
                    Log.d(TAG, "Cast SDK initialized — perms=" + permsOk + ", apiLevel=" + Build.VERSION.SDK_INT);

                    JSObject result = new JSObject();
                    result.put("initialized", true);
                    result.put("available", devicesAvailable);
                    result.put("permissionsGranted", permsOk);
                    result.put("appId", CAST_APP_ID);
                    call.resolve(result);
                } catch (Exception e) {
                    Log.e(TAG, "Cast init error", e);
                    call.reject("Cast init failed: " + e.getMessage());
                }
            });
        } catch (Exception e) { call.reject("Cast init failed: " + e.getMessage()); }
    }

    // ─── Request session ────────────────────────────────────────────
    @PluginMethod
    public void requestSession(PluginCall call) {
        if (!hasDiscoveryPermissions()) {
            Log.d(TAG, "requestSession — permissions missing, requesting...");
            requestPermissionForAlias("network", call, "networkPermissionCallback");
            return;
        }
        try {
            getActivity().runOnUiThread(() -> {
                try {
                    if (mediaRouter != null && mediaRouteSelector != null) {
                        updateDeviceAvailability(mediaRouter);
                        androidx.mediarouter.app.MediaRouteChooserDialog dialog =
                            new androidx.mediarouter.app.MediaRouteChooserDialog(getActivity());
                        dialog.setRouteSelector(mediaRouteSelector);
                        dialog.show();
                    } else {
                        call.reject("Cast not initialized");
                        return;
                    }
                    call.resolve();
                } catch (Exception e) { call.reject("requestSession failed: " + e.getMessage()); }
            });
        } catch (Exception e) { call.reject("requestSession failed: " + e.getMessage()); }
    }

    // ─── End session ────────────────────────────────────────────────
    @PluginMethod
    public void endSession(PluginCall call) {
        try {
            getActivity().runOnUiThread(() -> {
                try {
                    if (castContext != null) {
                        CastSession session = castContext.getSessionManager().getCurrentCastSession();
                        if (session != null) castContext.getSessionManager().endCurrentSession(true);
                    }
                    call.resolve();
                } catch (Exception e) { call.reject("endSession failed: " + e.getMessage()); }
            });
        } catch (Exception e) { call.reject("endSession failed: " + e.getMessage()); }
    }

    // ─── Load media (v2.5.4: resolve stream URL before sending to Cast) ─
    @PluginMethod
    public void loadMedia(PluginCall call) {
        String streamUrl = call.getString("streamUrl", "");
        String title = call.getString("title", "Radio Sphere");
        String logo = call.getString("logo", "");
        String tags = call.getString("tags", "");
        String stationId = call.getString("stationId", "");

        // v2.5.4: Resolve stream URL asynchronously (follows redirects, parses .m3u/.pls)
        new Thread(() -> {
            String resolvedUrl = resolveStreamUrlSafely(streamUrl);
            String contentType = detectMimeType(resolvedUrl);
            Log.d(TAG, "Cast loadMedia: resolved=" + resolvedUrl + " (original=" + streamUrl + "), mime=" + contentType);

            try {
                getActivity().runOnUiThread(() -> {
                    try {
                        CastSession session = castContext != null ?
                            castContext.getSessionManager().getCurrentCastSession() : null;
                        if (session == null) { call.reject("No Cast session"); return; }
                        RemoteMediaClient rmc = session.getRemoteMediaClient();
                        if (rmc == null) { call.reject("No remote media client"); return; }

                        MediaMetadata metadata = new MediaMetadata(MediaMetadata.MEDIA_TYPE_MUSIC_TRACK);
                        metadata.putString(MediaMetadata.KEY_TITLE, title);
                        metadata.putString(MediaMetadata.KEY_ARTIST, "Radio Sphere");
                        if (logo != null && !logo.isEmpty()) {
                            // Keep HTTPS for logo images (display only, not audio)
                            metadata.addImage(new WebImage(Uri.parse(logo.replace("http://", "https://"))));
                        }

                        org.json.JSONObject customData = new org.json.JSONObject();
                        try { customData.put("tags", tags); customData.put("stationId", stationId); } catch (Exception e) {}

                        // v2.5.4: Use resolved URL as-is (no HTTPS forcing) + detected MIME type
                        MediaInfo mediaInfo = new MediaInfo.Builder(resolvedUrl)
                            .setStreamType(MediaInfo.STREAM_TYPE_LIVE)
                            .setContentType(contentType)
                            .setMetadata(metadata)
                            .setCustomData(customData).build();
                        MediaLoadRequestData loadReq = new MediaLoadRequestData.Builder()
                            .setMediaInfo(mediaInfo).setAutoplay(true).build();
                        rmc.load(loadReq);
                        call.resolve();
                    } catch (Exception e) { call.reject("loadMedia failed: " + e.getMessage()); }
                });
            } catch (Exception e) { call.reject("loadMedia failed: " + e.getMessage()); }
        }).start();
    }

    // ─── Toggle play/pause ──────────────────────────────────────────
    @PluginMethod
    public void togglePlayPause(PluginCall call) {
        try {
            getActivity().runOnUiThread(() -> {
                try {
                    CastSession session = castContext != null ?
                        castContext.getSessionManager().getCurrentCastSession() : null;
                    if (session == null) { call.resolve(); return; }
                    RemoteMediaClient client = session.getRemoteMediaClient();
                    if (client == null) { call.resolve(); return; }
                    if (client.isPlaying()) { client.pause(); } else { client.play(); }
                    call.resolve();
                } catch (Exception e) { call.reject("togglePlayPause failed: " + e.getMessage()); }
            });
        } catch (Exception e) { call.reject("togglePlayPause failed: " + e.getMessage()); }
    }

    // ─── Stream URL Resolution (ported from RadioBrowserService) ────
    private String resolveStreamUrlSafely(String urlStr) {
        Future<String> future = streamResolverExecutor.submit(() -> resolveStreamUrl(urlStr));
        try {
            return future.get(RESOLVE_TIMEOUT_MS, TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            future.cancel(true);
            Log.w(TAG, "resolveStreamUrl timeout (" + RESOLVE_TIMEOUT_MS + "ms), using raw URL");
            return urlStr;
        } catch (InterruptedException e) {
            future.cancel(true);
            Thread.currentThread().interrupt();
            Log.w(TAG, "resolveStreamUrl interrupted, using raw URL");
            return urlStr;
        } catch (Exception e) {
            future.cancel(true);
            Log.w(TAG, "resolveStreamUrl failed, using raw URL: " + e.getMessage());
            return urlStr;
        }
    }

    private String resolveStreamUrl(String urlStr) {
        Log.d(TAG, "resolveStreamUrl: " + urlStr);
        try {
            String resolved = followRedirects(urlStr, 5);

            String serverContentType = "";
            try {
                HttpURLConnection headConn = (HttpURLConnection) new URL(resolved).openConnection();
                headConn.setRequestMethod("HEAD");
                headConn.setConnectTimeout(NETWORK_TIMEOUT_MS);
                headConn.setReadTimeout(NETWORK_TIMEOUT_MS);
                headConn.setRequestProperty("User-Agent", USER_AGENT);
                headConn.setInstanceFollowRedirects(true);
                serverContentType = headConn.getContentType();
                headConn.disconnect();
                if (serverContentType == null) serverContentType = "";
                serverContentType = serverContentType.toLowerCase();
                Log.d(TAG, "Content-Type for " + resolved + ": " + serverContentType);
            } catch (Exception e) {
                Log.w(TAG, "HEAD request failed, falling back to extension detection: " + e.getMessage());
            }

            String lower = resolved.toLowerCase();
            boolean isPls = serverContentType.contains("audio/x-scpls") || lower.endsWith(".pls") || lower.contains(".pls?");
            boolean isM3u = serverContentType.contains("audio/mpegurl") || serverContentType.contains("audio/x-mpegurl")
                || lower.endsWith(".m3u") || lower.endsWith(".m3u8") || lower.contains(".m3u?");

            if (isM3u) {
                String fromPlaylist = parseM3uPlaylist(resolved);
                if (fromPlaylist != null) {
                    Log.d(TAG, "Resolved from M3U: " + fromPlaylist);
                    return fromPlaylist;
                }
            } else if (isPls) {
                String fromPlaylist = parsePlsPlaylist(resolved);
                if (fromPlaylist != null) {
                    Log.d(TAG, "Resolved from PLS: " + fromPlaylist);
                    return fromPlaylist;
                }
            }
            Log.d(TAG, "Resolved URL: " + resolved);
            return resolved;
        } catch (Exception e) {
            Log.w(TAG, "resolveStreamUrl failed, using original: " + e.getMessage());
            return urlStr;
        }
    }

    private String followRedirects(String urlStr, int maxRedirects) throws Exception {
        String current = urlStr;
        for (int i = 0; i < maxRedirects; i++) {
            HttpURLConnection conn = (HttpURLConnection) new URL(current).openConnection();
            conn.setInstanceFollowRedirects(false);
            conn.setConnectTimeout(NETWORK_TIMEOUT_MS);
            conn.setReadTimeout(NETWORK_TIMEOUT_MS);
            conn.setRequestMethod("HEAD");
            conn.setRequestProperty("User-Agent", USER_AGENT);
            int code;
            try {
                code = conn.getResponseCode();
            } catch (Exception e) {
                conn.disconnect();
                conn = (HttpURLConnection) new URL(current).openConnection();
                conn.setInstanceFollowRedirects(false);
                conn.setConnectTimeout(NETWORK_TIMEOUT_MS);
                conn.setReadTimeout(NETWORK_TIMEOUT_MS);
                conn.setRequestMethod("GET");
                conn.setRequestProperty("User-Agent", USER_AGENT);
                code = conn.getResponseCode();
            }
            if (code >= 300 && code < 400) {
                String location = conn.getHeaderField("Location");
                conn.disconnect();
                if (location == null || location.isEmpty()) break;
                if (location.startsWith("/")) {
                    URL base = new URL(current);
                    location = base.getProtocol() + "://" + base.getHost() + location;
                }
                Log.d(TAG, "Redirect " + code + ": " + current + " -> " + location);
                current = location;
            } else {
                conn.disconnect();
                break;
            }
        }
        return current;
    }

    private String parseM3uPlaylist(String urlStr) {
        try {
            String content = httpGet(urlStr);
            String[] lines = content.split("\n");
            for (String line : lines) {
                line = line.trim();
                if (!line.isEmpty() && !line.startsWith("#")) {
                    return line;
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "parseM3uPlaylist error: " + e.getMessage());
        }
        return null;
    }

    private String parsePlsPlaylist(String urlStr) {
        try {
            String content = httpGet(urlStr);
            String[] lines = content.split("\n");
            for (String line : lines) {
                line = line.trim();
                if (line.toLowerCase().matches("^file\\d+=.*")) {
                    String url = line.substring(line.indexOf('=') + 1).trim();
                    if (!url.isEmpty()) return url;
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "parsePlsPlaylist error: " + e.getMessage());
        }
        return null;
    }

    private String httpGet(String urlStr) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
        conn.setConnectTimeout(NETWORK_TIMEOUT_MS);
        conn.setReadTimeout(NETWORK_TIMEOUT_MS);
        conn.setRequestProperty("User-Agent", USER_AGENT);
        conn.setInstanceFollowRedirects(true);
        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) sb.append(line).append("\n");
        reader.close();
        conn.disconnect();
        return sb.toString();
    }

    // ─── MIME type detection from URL ───────────────────────────────
    private String detectMimeType(String url) {
        if (url == null) return "audio/mpeg";
        String lower = url.toLowerCase();
        if (lower.contains(".aac")) return "audio/aac";
        if (lower.contains(".ogg") || lower.contains(".oga")) return "audio/ogg";
        if (lower.contains(".opus")) return "audio/ogg; codecs=opus";
        if (lower.contains(".flac")) return "audio/flac";
        if (lower.contains(".m3u8")) return "application/x-mpegurl";
        if (lower.contains(".mp3") || lower.contains("mp3")) return "audio/mpeg";
        // Default to audio/mpeg — most radio streams are MP3
        return "audio/mpeg";
    }

    // ─── Cleanup ────────────────────────────────────────────────────
    @Override
    protected void handleOnDestroy() {
        if (castContext != null) castContext.getSessionManager().removeSessionManagerListener(sessionListener, CastSession.class);
        if (mediaRouter != null) mediaRouter.removeCallback(mediaRouterCallback);
        streamResolverExecutor.shutdownNow();
        super.handleOnDestroy();
    }
}

package com.radiosphere.app;

import android.net.Uri;
import android.os.Bundle;
import android.support.v4.media.MediaBrowserCompat;
import android.support.v4.media.MediaDescriptionCompat;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.media.MediaBrowserServiceCompat;
import com.google.android.exoplayer2.ExoPlayer;
import com.google.android.exoplayer2.MediaItem;
import com.google.android.exoplayer2.Player;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

/**
 * RadioBrowserService — Android Auto MediaBrowserService for RadioSphere.
 *
 * Provides browse tree (Favorites, Recents, Genres) and voice search.
 * Reads favorites/recents from SharedPreferences (synced from WebView via RadioAutoPlugin).
 * Uses ExoPlayer for native audio playback independent of the WebView.
 */
public class RadioBrowserService extends MediaBrowserServiceCompat {

    private static final String ROOT_ID = "root";
    private static final String FAVORITES_ID = "favorites";
    private static final String RECENTS_ID = "recents";
    private static final String GENRES_ID = "genres";

    private static final String GENRE_PREFIX = "genre:";
    private static final String STATION_PREFIX = "station:";

    private static final String PREFS_NAME = "RadioAutoPrefs";
    private static final String KEY_FAVORITES = "favorites_json";
    private static final String KEY_RECENTS = "recents_json";

    private static final String[] GENRES = {
        "60s", "70s", "80s", "90s", "ambient", "blues", "chillout", "classical",
        "country", "electronic", "funk", "hiphop", "jazz", "latin", "metal",
        "news", "pop", "r&b", "reggae", "rock", "soul", "techno", "trance", "world"
    };

    private static final String[] API_MIRRORS = {
        "https://de1.api.radio-browser.info",
        "https://fr1.api.radio-browser.info",
        "https://at1.api.radio-browser.info",
        "https://nl1.api.radio-browser.info"
    };

    private static final String DEFAULT_ARTWORK = "https://placehold.co/512x512/1a1a2e/e94560?text=RadioSphere";

    private MediaSessionCompat mediaSession;
    private ExoPlayer player;
    private List<StationData> currentStations = new ArrayList<>();
    private int currentIndex = -1;

    private static class StationData {
        final String id;
        final String name;
        final String streamUrl;
        final String logo;
        final String country;
        final String tags;

        StationData(String id, String name, String streamUrl, String logo, String country, String tags) {
            this.id = id;
            this.name = name;
            this.streamUrl = streamUrl;
            this.logo = logo;
            this.country = country;
            this.tags = tags;
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        player = new ExoPlayer.Builder(this).build();
        player.addListener(playerListener);

        mediaSession = new MediaSessionCompat(this, "RadioSphereAuto");
        mediaSession.setCallback(mediaSessionCallback);
        mediaSession.setActive(true);
        setSessionToken(mediaSession.getSessionToken());
    }

    @Override
    public void onDestroy() {
        player.release();
        mediaSession.release();
        super.onDestroy();
    }

    @Nullable
    @Override
    public BrowserRoot onGetRoot(@NonNull String clientPackageName, int clientUid, @Nullable Bundle rootHints) {
        return new BrowserRoot(ROOT_ID, null);
    }

    @Override
    public void onLoadChildren(@NonNull String parentId, @NonNull Result<List<MediaBrowserCompat.MediaItem>> result) {
        switch (parentId) {
            case ROOT_ID: {
                List<MediaBrowserCompat.MediaItem> items = new ArrayList<>();
                items.add(buildBrowsableItem(FAVORITES_ID, "Favoris", "Vos stations preferees"));
                items.add(buildBrowsableItem(RECENTS_ID, "Recents", "Dernieres stations ecoutees"));
                items.add(buildBrowsableItem(GENRES_ID, "Genres", "Explorer par genre musical"));
                result.sendResult(items);
                break;
            }
            case FAVORITES_ID: {
                List<StationData> stations = loadStations(KEY_FAVORITES);
                currentStations = stations;
                result.sendResult(toMediaItems(stations));
                break;
            }
            case RECENTS_ID: {
                List<StationData> stations = loadStations(KEY_RECENTS);
                currentStations = stations;
                result.sendResult(toMediaItems(stations));
                break;
            }
            case GENRES_ID: {
                List<MediaBrowserCompat.MediaItem> items = new ArrayList<>();
                for (String genre : GENRES) {
                    String title = genre.substring(0, 1).toUpperCase() + genre.substring(1);
                    items.add(buildBrowsableItem(GENRE_PREFIX + genre, title, "Stations " + genre + " populaires"));
                }
                result.sendResult(items);
                break;
            }
            default: {
                if (parentId.startsWith(GENRE_PREFIX)) {
                    String genre = parentId.substring(GENRE_PREFIX.length());
                    result.detach();
                    new Thread(() -> {
                        List<StationData> stations = fetchStationsByGenre(genre, 25);
                        currentStations = stations;
                        result.sendResult(toMediaItems(stations));
                    }).start();
                } else {
                    result.sendResult(new ArrayList<>());
                }
                break;
            }
        }
    }

    @Override
    public void onSearch(@NonNull String query, Bundle extras, @NonNull Result<List<MediaBrowserCompat.MediaItem>> result) {
        result.detach();
        new Thread(() -> {
            List<StationData> stations = searchStations(query, 25);
            currentStations = stations;
            result.sendResult(toMediaItems(stations));
        }).start();
    }

    private final MediaSessionCompat.Callback mediaSessionCallback = new MediaSessionCompat.Callback() {
        @Override
        public void onPlayFromMediaId(String mediaId, Bundle extras) {
            if (mediaId == null) return;
            String stationId = mediaId.startsWith(STATION_PREFIX) ? mediaId.substring(STATION_PREFIX.length()) : mediaId;
            for (int i = 0; i < currentStations.size(); i++) {
                if (currentStations.get(i).id.equals(stationId)) {
                    currentIndex = i;
                    playStation(currentStations.get(i));
                    return;
                }
            }
        }

        @Override
        public void onPlay() {
            player.play();
            updatePlaybackState(PlaybackStateCompat.STATE_PLAYING);
        }

        @Override
        public void onPause() {
            player.pause();
            updatePlaybackState(PlaybackStateCompat.STATE_PAUSED);
        }

        @Override
        public void onStop() {
            player.stop();
            updatePlaybackState(PlaybackStateCompat.STATE_STOPPED);
        }

        @Override
        public void onSkipToNext() {
            if (currentStations.isEmpty()) return;
            currentIndex = (currentIndex + 1) % currentStations.size();
            playStation(currentStations.get(currentIndex));
        }

        @Override
        public void onSkipToPrevious() {
            if (currentStations.isEmpty()) return;
            currentIndex = currentIndex - 1 < 0 ? currentStations.size() - 1 : currentIndex - 1;
            playStation(currentStations.get(currentIndex));
        }

        @Override
        public void onPlayFromSearch(String query, Bundle extras) {
            if (query == null || query.trim().isEmpty()) {
                List<StationData> favorites = loadStations(KEY_FAVORITES);
                if (!favorites.isEmpty()) {
                    currentStations = favorites;
                    currentIndex = 0;
                    playStation(favorites.get(0));
                }
                return;
            }
            String q = query;
            new Thread(() -> {
                List<StationData> stations = searchStations(q, 25);
                if (!stations.isEmpty()) {
                    currentStations = stations;
                    currentIndex = 0;
                    playStation(stations.get(0));
                }
            }).start();
        }
    };

    private final Player.Listener playerListener = new Player.Listener() {
        @Override
        public void onPlaybackStateChanged(int playbackState) {
            switch (playbackState) {
                case Player.STATE_BUFFERING:
                    updatePlaybackState(PlaybackStateCompat.STATE_BUFFERING);
                    break;
                case Player.STATE_READY:
                    if (player.isPlaying()) {
                        updatePlaybackState(PlaybackStateCompat.STATE_PLAYING);
                    }
                    break;
                case Player.STATE_ENDED:
                case Player.STATE_IDLE:
                    updatePlaybackState(PlaybackStateCompat.STATE_STOPPED);
                    break;
            }
        }

        @Override
        public void onIsPlayingChanged(boolean isPlaying) {
            updatePlaybackState(isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED);
        }
    };

    private void playStation(StationData station) {
        player.stop();
        player.setMediaItem(MediaItem.fromUri(station.streamUrl));
        player.prepare();
        player.play();

        String artworkUrl = (station.logo != null && !station.logo.isEmpty())
            ? station.logo.replace("http://", "https://")
            : DEFAULT_ARTWORK;
        Uri artworkUri = Uri.parse(artworkUrl);

        String artist = "Radio Sphere";
        if (station.tags != null && !station.tags.isEmpty()) {
            String[] tagArr = station.tags.split(",");
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < Math.min(2, tagArr.length); i++) {
                if (i > 0) sb.append(" - ");
                sb.append(tagArr[i].trim());
            }
            if (sb.length() > 0) artist = sb.toString();
        }

        String album = (station.country != null && !station.country.isEmpty()) ? station.country : "Live";

        MediaMetadataCompat metadata = new MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_MEDIA_ID, station.id)
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, station.name)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
            .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, album)
            .putString(MediaMetadataCompat.METADATA_KEY_DISPLAY_ICON_URI, artworkUri.toString())
            .putString(MediaMetadataCompat.METADATA_KEY_ART_URI, artworkUri.toString())
            .putString(MediaMetadataCompat.METADATA_KEY_ALBUM_ART_URI, artworkUri.toString())
            .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, -1)
            .build();

        mediaSession.setMetadata(metadata);
        updatePlaybackState(PlaybackStateCompat.STATE_BUFFERING);
    }

    private void updatePlaybackState(int state) {
        long actions = PlaybackStateCompat.ACTION_PLAY
            | PlaybackStateCompat.ACTION_PAUSE
            | PlaybackStateCompat.ACTION_STOP
            | PlaybackStateCompat.ACTION_SKIP_TO_NEXT
            | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
            | PlaybackStateCompat.ACTION_PLAY_FROM_SEARCH
            | PlaybackStateCompat.ACTION_PLAY_FROM_MEDIA_ID;

        PlaybackStateCompat playbackState = new PlaybackStateCompat.Builder()
            .setActions(actions)
            .setState(state, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1.0f)
            .build();

        mediaSession.setPlaybackState(playbackState);
    }

    private List<StationData> loadStations(String key) {
        String json = getSharedPreferences(PREFS_NAME, MODE_PRIVATE).getString(key, "[]");
        return parseStationsJson(json);
    }

    private List<StationData> parseStationsJson(String json) {
        List<StationData> list = new ArrayList<>();
        try {
            JSONArray arr = new JSONArray(json);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                String streamUrl = obj.optString("streamUrl", "");
                if (!streamUrl.isEmpty()) {
                    list.add(new StationData(
                        obj.optString("id", ""),
                        obj.optString("name", "Unknown"),
                        streamUrl,
                        obj.optString("logo", ""),
                        obj.optString("country", ""),
                        obj.optString("tags", "")
                    ));
                }
            }
        } catch (Exception e) {
            // ignore
        }
        return list;
    }

    private List<StationData> fetchStationsByGenre(String genre, int limit) {
        for (String mirror : API_MIRRORS) {
            try {
                String url = mirror + "/json/stations/bytag/" + Uri.encode(genre)
                    + "?limit=" + limit + "&order=votes&reverse=true&hidebroken=true";
                return parseApiResponse(httpGet(url));
            } catch (Exception e) { /* next */ }
        }
        return new ArrayList<>();
    }

    private List<StationData> searchStations(String query, int limit) {
        for (String mirror : API_MIRRORS) {
            try {
                String url = mirror + "/json/stations/search?name=" + Uri.encode(query)
                    + "&limit=" + limit + "&order=votes&reverse=true&hidebroken=true";
                return parseApiResponse(httpGet(url));
            } catch (Exception e) { /* next */ }
        }
        return new ArrayList<>();
    }

    private String httpGet(String urlStr) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(5000);
        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) sb.append(line);
        reader.close();
        conn.disconnect();
        return sb.toString();
    }

    private List<StationData> parseApiResponse(String json) {
        List<StationData> list = new ArrayList<>();
        try {
            JSONArray arr = new JSONArray(json);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                String streamUrl = obj.optString("url_resolved", obj.optString("url", ""));
                if (!streamUrl.isEmpty()) {
                    list.add(new StationData(
                        obj.optString("stationuuid", ""),
                        obj.optString("name", "Unknown"),
                        streamUrl,
                        obj.optString("favicon", ""),
                        obj.optString("country", ""),
                        obj.optString("tags", "")
                    ));
                }
            }
        } catch (Exception e) { /* ignore */ }
        return list;
    }

    private List<MediaBrowserCompat.MediaItem> toMediaItems(List<StationData> stations) {
        List<MediaBrowserCompat.MediaItem> items = new ArrayList<>();
        for (StationData s : stations) items.add(stationToMediaItem(s));
        return items;
    }

    private MediaBrowserCompat.MediaItem stationToMediaItem(StationData station) {
        String artworkUrl = (station.logo != null && !station.logo.isEmpty())
            ? station.logo.replace("http://", "https://") : DEFAULT_ARTWORK;

        String subtitle = "Radio Sphere";
        if (station.tags != null && !station.tags.isEmpty()) {
            String[] tagArr = station.tags.split(",");
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < Math.min(2, tagArr.length); i++) {
                if (i > 0) sb.append(" - ");
                sb.append(tagArr[i].trim());
            }
            if (sb.length() > 0) subtitle = sb.toString();
        }
        if (subtitle.equals("Radio Sphere") && station.country != null && !station.country.isEmpty()) {
            subtitle = station.country;
        }

        MediaDescriptionCompat desc = new MediaDescriptionCompat.Builder()
            .setMediaId(STATION_PREFIX + station.id)
            .setTitle(station.name)
            .setSubtitle(subtitle)
            .setIconUri(Uri.parse(artworkUrl))
            .build();

        return new MediaBrowserCompat.MediaItem(desc, MediaBrowserCompat.MediaItem.FLAG_PLAYABLE);
    }

    private MediaBrowserCompat.MediaItem buildBrowsableItem(String mediaId, String title, String subtitle) {
        MediaDescriptionCompat desc = new MediaDescriptionCompat.Builder()
            .setMediaId(mediaId)
            .setTitle(title)
            .setSubtitle(subtitle)
            .build();
        return new MediaBrowserCompat.MediaItem(desc, MediaBrowserCompat.MediaItem.FLAG_BROWSABLE);
    }
}

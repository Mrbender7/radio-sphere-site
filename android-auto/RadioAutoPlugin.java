package com.radiosphere.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * RadioAutoPlugin — Native Capacitor plugin (Android side).
 *
 * Receives favorites, recents, and playback state from the WebView
 * and stores them in SharedPreferences so RadioBrowserService can read them.
 */
@CapacitorPlugin(name = "RadioAutoPlugin")
public class RadioAutoPlugin extends Plugin {

    private static final String PREFS_NAME = "RadioAutoPrefs";
    private static final String KEY_FAVORITES = "favorites_json";
    private static final String KEY_RECENTS = "recents_json";
    private static final String KEY_PLAYBACK_STATE = "playback_state_json";

    private SharedPreferences getPrefs() {
        return getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void syncFavorites(PluginCall call) {
        String stations = call.getString("stations", "[]");
        getPrefs().edit().putString(KEY_FAVORITES, stations).apply();
        call.resolve();
    }

    @PluginMethod
    public void syncRecents(PluginCall call) {
        String stations = call.getString("stations", "[]");
        getPrefs().edit().putString(KEY_RECENTS, stations).apply();
        call.resolve();
    }

    @PluginMethod
    public void notifyPlaybackState(PluginCall call) {
        String stationId = call.getString("stationId", "");
        String name = call.getString("name", "");
        String logo = call.getString("logo", "");
        String streamUrl = call.getString("streamUrl", "");
        Boolean isPlaying = call.getBoolean("isPlaying", false);
        String tags = call.getString("tags", "");
        String country = call.getString("country", "");

        String json = "{"
            + "\"stationId\":\"" + stationId + "\","
            + "\"name\":\"" + name.replace("\"", "\\\"") + "\","
            + "\"logo\":\"" + logo + "\","
            + "\"streamUrl\":\"" + streamUrl + "\","
            + "\"isPlaying\":" + isPlaying + ","
            + "\"tags\":\"" + tags.replace("\"", "\\\"") + "\","
            + "\"country\":\"" + country.replace("\"", "\\\"") + "\""
            + "}";

        getPrefs().edit().putString(KEY_PLAYBACK_STATE, json).apply();
        call.resolve();
    }
}

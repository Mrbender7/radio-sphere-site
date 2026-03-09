

## Analysis: StreamBuffer / Timeback Machine Architecture

### Current State
The `allorigins.win` proxy has already been fully removed from the codebase (confirmed via search). Both `StreamBufferContext` and `PlayerContext` now use the direct `streamUrl`. The code is architecturally sound.

### Remaining Problem: CORS on Web Preview

The core issue is that `fetch(streamUrl)` in `StreamBufferContext` will fail with CORS errors in the browser for most radio streams (servers don't send `Access-Control-Allow-Origin`). The `<audio>` element in `PlayerContext` works because `<audio>` is exempt from CORS, but `fetch()` is not.

This is **unfixable in a pure browser context without a proxy**. However:
- On **Android (Capacitor)**, CORS is bypassed natively by the WebView's `MIXED_CONTENT_ALWAYS_ALLOW` and network config
- On **web preview**, the fetch will fail silently for most stations — this is expected behavior

### Plan: Add Diagnostic Logging & Graceful Degradation

**1. `StreamBufferContext.tsx` — Add chunk logging and CORS error handling**
- Add `console.log("[StreamBuffer] Chunk received:", value.byteLength)` in the readLoop (as recommended by the Android Studio analysis)
- On fetch failure, log a clear message distinguishing CORS errors from other failures
- When CORS blocks the fetch on web, set `bufferAvailable = false` gracefully without spamming errors

**2. `StreamBufferContext.tsx` — Stabilize station reference check**
- The `useEffect` dependency on `currentStation?.id` is correct and stable (string comparison)
- Add a guard: only restart fetch if `isPlaying` is true, to avoid unnecessary fetch attempts when the player is paused
- Add `console.log` when the effect fires to confirm it's not looping

**3. `StreamBufferContext.tsx` — `returnToLiveInternal` is already correct**
- Uses direct `streamUrl` (proxy was removed)
- No changes needed

**Files modified:**
- `src/contexts/StreamBufferContext.tsx` (add diagnostic logs, CORS-aware error handling, isPlaying guard)

This is a minimal, targeted fix — no architectural changes, just logging and graceful degradation for the web context where CORS blocks `fetch()`.




# Fix: Pause button unresponsive + auto-restart after minimize

## Root cause analysis

Two bugs, both caused by the same mechanisms in `PlayerContext.tsx`:

### Bug 1: Pause requires 2 taps (dynamic content switching)
- `isPlayingRef` is updated via `useEffect` (line 90-92), which is **asynchronous**
- When user taps pause, `setState({isPlaying: false})` fires, but `isPlayingRef.current` remains `true` until the next React render cycle
- Meanwhile, the `keepAlive` handler (lines 359-369) fires on `visibilitychange`/`blur`/`focus` events — which trigger when switching between dynamic content and the app
- `keepAlive` checks `isPlayingRef.current` (still `true`), calls `audio.play()`, undoing the pause
- User must tap pause a second time

### Bug 2: Station restarts after minimize
- Same `keepAlive` handler fires on `visibilitychange` when app goes to background
- Since `isPlayingRef.current` is still `true` (async delay), it calls `audio.play()`
- Additionally, the heartbeat (line 118-134) runs every 10s, detects `audio.paused === true`, considers the stream "dead", and calls `reloadStream()` — which fully restarts playback

## Fix plan

### 1. Update `isPlayingRef` synchronously (PlayerContext.tsx)
In `togglePlay`, `handlePause`, and `handlePlay`: set `isPlayingRef.current` **directly** before or alongside `setState`, not via the async `useEffect`. This eliminates the race window.

Remove the `useEffect` at line 90-92 that syncs `isPlayingRef` — it becomes redundant.

### 2. Fix `keepAlive` handler (PlayerContext.tsx, lines 359-369)
Current code fires on `visibilitychange`, `blur`, AND `focus` — and unconditionally calls `audio.play()`.

Change to:
- Only act on `visibilitychange` when `document.visibilityState === 'visible'` (returning to foreground)
- Remove `blur` listener entirely (it's counterproductive — fires when leaving the app)
- Keep `focus` but only resume if not intentionally paused

### 3. Heartbeat guard (PlayerContext.tsx, line 125)
The heartbeat already checks `isPlayingRef.current`, but due to the async ref update, it can still trigger after an intentional pause. With the synchronous ref fix from step 1, this is automatically resolved.

## Files modified
- `src/contexts/PlayerContext.tsx` — all changes in one file

## Summary of changes
- Synchronous `isPlayingRef` updates in `togglePlay`, `handlePause`, `handlePlay`, `reloadStream`
- `keepAlive` only resumes on visibility return (not blur/minimize)
- Remove redundant `useEffect` ref sync


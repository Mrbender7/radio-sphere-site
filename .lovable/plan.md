

## Plan: Reorganize FullScreenPlayer, MiniPlayer, and improve TimebackMachine

### 1. Copy the TBM logo image to assets
- Copy `user-uploads://tbm2_TP.png` to `src/assets/tbm-logo.png`

### 2. FullScreenPlayer.tsx - Major layout changes

**Station name with marquee effect:**
- Replace the multi-line `<h2>` with a single-line marquee system identical to MiniPlayer (hidden measurer span, overflow container, `animate-marquee` class when text overflows)
- Add `useRef`, `useEffect`, `useState` for marquee detection

**Audio Visualizer moved left of station name:**
- Remove the standalone visualizer section below artwork
- Place `<AudioVisualizer>` inline to the left of the station name, inside the title row

**LIVE badge:**
- Remove the old "LIVE badge + Timeback Machine button" section
- Add a centered LIVE badge below the artwork area:
  - Green with glow (`shadow-[0_0_12px_...]`) when `isPlaying` (station emitting sound)
  - Red with glow when not playing
  - Always visible, centered

**TBM button (replaces "Retour dans le passé"):**
- Remove the old cassette-icon text button entirely
- Add a round button to the LEFT of the play/pause button in the controls row
- Uses the imported TBM logo image
- Default state: theme colors, subtle glow
- When `bufferAvailable` is true: stronger glow effect (brighter than play button), pulsing animation
- Same size as play button or slightly smaller (w-14 h-14)

**Controls layout:**
- Center: Play/Pause button (unchanged)
- Left of Play: TBM round button
- Keep the vertical volume slider on the right

### 3. MiniPlayer.tsx - Visualizer repositioned

- Move `<AudioVisualizer>` from after the text zone to BETWEEN the artwork and the text zone
- Keep everything else unchanged

### 4. CassetteAnimation.tsx - Enhanced 3D cassette

- Add more realistic 3D effects:
  - Multiple gradient layers for depth
  - Inner shadows and highlights
  - Beveled edges on the cassette body
  - More detailed reels with hub teeth pattern
  - Tape path visible between reels
  - Reflective highlight strip on the cassette body
  - Bottom edge shadow for volume effect

### 5. TimebackMachine.tsx - Fix "Retour au direct" button

- The `handleReturnToLive` function already calls `returnToLive()` and `onClose()` - verify the footer button is properly wired (it already is, but confirm `returnToLive` in context actually works with the proxy-based fetch)
- Add debug info section back to TBM showing buffer status, fetch status, chunks count

### 6. tailwind.config.ts - Add TBM glow keyframe

- Add a `tbm-glow` keyframe with stronger pulsing glow in theme colors (blue-to-violet)
- Register as `animate-tbm-glow`

### Technical details

**Files modified:**
- `src/assets/tbm-logo.png` (new - copied from upload)
- `src/components/FullScreenPlayer.tsx` (major restructure)
- `src/components/MiniPlayer.tsx` (move visualizer position)
- `src/components/CassetteAnimation.tsx` (enhanced 3D styling)
- `src/components/TimebackMachine.tsx` (add debug info back)
- `tailwind.config.ts` (add tbm-glow animation)

**Marquee implementation in FullScreenPlayer** reuses the exact same pattern as MiniPlayer: hidden measurer span, `useRef` + `useEffect` to detect overflow, `animate-marquee` class with calculated duration based on `MARQUEE_SPEED = 40`.

**TBM button glow states:**
- Inactive (`!bufferAvailable`): `opacity-60`, muted border, no glow
- Available (`bufferAvailable && !isRecording`): theme gradient border, strong pulsing glow via `animate-tbm-glow`
- The glow should be visually stronger than the play-breathe animation


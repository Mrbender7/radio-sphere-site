import { useCallback, useRef } from "react";
import { RadioStation } from "@/types/radio";
import { isInAppBrowser } from "@/utils/inAppBrowser";

const prefetchCache = new Map<string, { audio: HTMLAudioElement; timer: ReturnType<typeof setTimeout> }>();
const PREFETCH_TTL = 15_000; // auto-cleanup after 15s

// In-app browser WebViews (Facebook/Instagram/…) often choke on background
// Audio() instances tied to remote streams. Skip prefetching there entirely.
const PREFETCH_DISABLED = typeof navigator !== "undefined" && isInAppBrowser();

export function prefetchStream(station: RadioStation) {
  if (PREFETCH_DISABLED) return;
  if (!station.streamUrl) return;
  const id = station.id;
  if (prefetchCache.has(id)) return;

  let audio: HTMLAudioElement;
  try {
    audio = new Audio();
    audio.preload = "auto";
    audio.volume = 0;
    audio.muted = true;
    audio.src = station.streamUrl.replace("http://", "https://");
    audio.load();
  } catch {
    return;
  }

  const timer = setTimeout(() => {
    try {
      audio.src = "";
      audio.load();
    } catch { /* noop */ }
    prefetchCache.delete(id);
  }, PREFETCH_TTL);

  prefetchCache.set(id, { audio, timer });
}

export function cancelPrefetch(stationId: string) {
  const entry = prefetchCache.get(stationId);
  if (entry) {
    clearTimeout(entry.timer);
    try {
      entry.audio.src = "";
      entry.audio.load();
    } catch { /* noop */ }
    prefetchCache.delete(stationId);
  }
}

export function useStreamPrefetch() {
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onHover = useCallback((station: RadioStation) => {
    if (PREFETCH_DISABLED) return;
    // Small delay to avoid prefetching on quick mouse passes
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      prefetchStream(station);
    }, 200);
  }, []);

  const onLeave = useCallback((_station: RadioStation) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  return { onHover, onLeave };
}

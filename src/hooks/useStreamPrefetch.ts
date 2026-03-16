import { useCallback, useRef } from "react";
import { RadioStation } from "@/types/radio";

const prefetchCache = new Map<string, { audio: HTMLAudioElement; timer: ReturnType<typeof setTimeout> }>();
const PREFETCH_TTL = 15_000; // auto-cleanup after 15s

export function prefetchStream(station: RadioStation) {
  if (!station.streamUrl) return;
  const id = station.id;
  if (prefetchCache.has(id)) return;

  const audio = new Audio();
  audio.preload = "auto";
  audio.volume = 0;
  audio.muted = true;
  // Force the browser to start buffering by setting src
  audio.src = station.streamUrl.replace("http://", "https://");
  // Start loading but don't play
  audio.load();

  const timer = setTimeout(() => {
    audio.src = "";
    audio.load();
    prefetchCache.delete(id);
  }, PREFETCH_TTL);

  prefetchCache.set(id, { audio, timer });
}

export function cancelPrefetch(stationId: string) {
  const entry = prefetchCache.get(stationId);
  if (entry) {
    clearTimeout(entry.timer);
    entry.audio.src = "";
    entry.audio.load();
    prefetchCache.delete(stationId);
  }
}

export function useStreamPrefetch() {
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onHover = useCallback((station: RadioStation) => {
    // Small delay to avoid prefetching on quick mouse passes
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      prefetchStream(station);
    }, 200);
  }, []);

  const onLeave = useCallback((station: RadioStation) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  return { onHover, onLeave };
}

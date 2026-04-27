import { RadioStation } from "@/types/radio";

type UmamiWindow = Window & {
  umami?: { track: (name: string, data?: Record<string, unknown>) => void };
};

/**
 * Send a Umami custom event safely.
 * - No-ops when Umami is not loaded (Brave / blockers / WebViews).
 * - Wrapped in try/catch (consistent with WebView hardening policy).
 */
export function umamiTrack(event: string, data?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    const w = window as UmamiWindow;
    w.umami?.track(event, data);
  } catch {
    /* noop */
  }
}

/**
 * Track a qualified station listen ("station-played").
 * Only call this AFTER the 30s anti-zapping delay.
 */
export function trackStationPlayed(station: RadioStation): void {
  if (!station) return;
  const rawGenre = station.tags?.[0] ?? "unknown";
  const genre = String(rawGenre).toLowerCase().slice(0, 40) || "unknown";
  umamiTrack("station-played", {
    name: String(station.name ?? "unknown").slice(0, 80),
    genre,
    country: station.country ?? "unknown",
  });
}

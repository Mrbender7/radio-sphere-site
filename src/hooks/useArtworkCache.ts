import { useCallback, useRef, useSyncExternalStore } from "react";
import stationPlaceholder from "@/assets/station-placeholder.png";

// ── Types ──────────────────────────────────────────────────────────
type ArtworkStatus = "PENDING" | "CHECKING" | "RESOLVED";

interface CacheEntry {
  status: ArtworkStatus;
  resolvedUrl: string; // final URL to display
  checked: boolean;    // quality validation done?
}

// ── In-memory store (shared across all hook instances) ─────────────
const STORAGE_KEY = "radiosphere_artwork_cache";
const MIN_DIMENSION = 300;
const MIN_BYTES = 10_000; // 10 KB

const memoryCache = new Map<string, CacheEntry>();
const listeners = new Set<() => void>();
const inflightChecks = new Map<string, Promise<string>>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

// ── LocalStorage helpers ───────────────────────────────────────────
function loadPersistedCache(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function persistEntry(stationId: string, url: string) {
  try {
    const store = loadPersistedCache();
    store[stationId] = url;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch { /* quota exceeded — non-critical */ }
}

// ── Image validation ───────────────────────────────────────────────
function validateImage(url: string): Promise<"OK" | "LOW_QUALITY" | "ERROR"> {
  return new Promise((resolve) => {
    if (!url) { resolve("ERROR"); return; }

    const timeout = setTimeout(() => {
      console.warn("[ArtworkCache] ⏱ Timeout validating:", url);
      resolve("ERROR");
    }, 8000);

    // Try to get file size via HEAD (cors mode so we can read headers)
    const sizeCheck = fetch(url, { method: "HEAD" })
      .then((r) => {
        if (!r.ok) return null;
        const len = r.headers.get("content-length");
        if (len && parseInt(len, 10) < MIN_BYTES) return "LOW_QUALITY" as const;
        return null; // inconclusive
      })
      .catch(() => null);

    const img = new Image();
    // Don't set crossOrigin — we only need dimensions, not canvas access
    img.onload = async () => {
      clearTimeout(timeout);
      if (img.naturalWidth < MIN_DIMENSION || img.naturalHeight < MIN_DIMENSION) {
        console.debug("[ArtworkCache] 📐 LOW_QUALITY (dimensions):", url, img.naturalWidth, "x", img.naturalHeight);
        resolve("LOW_QUALITY");
        return;
      }
      const sizeResult = await sizeCheck;
      if (sizeResult === "LOW_QUALITY") {
        console.debug("[ArtworkCache] 📦 LOW_QUALITY (size):", url);
      } else {
        console.debug("[ArtworkCache] ✅ OK:", url);
      }
      resolve(sizeResult === "LOW_QUALITY" ? "LOW_QUALITY" : "OK");
    };
    img.onerror = () => {
      clearTimeout(timeout);
      console.warn("[ArtworkCache] ❌ Error loading:", url);
      resolve("ERROR");
    };
    img.src = url;
  });
}

// ── Fallback chain ─────────────────────────────────────────────────
function extractDomain(homepage: string): string | null {
  try {
    return new URL(homepage).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function tryClearbit(homepage: string): Promise<string | null> {
  const domain = extractDomain(homepage);
  if (!domain) { console.debug("[ArtworkCache] Clearbit: no domain from", homepage); return null; }
  const url = `https://logo.clearbit.com/${domain}?size=512`;
  console.debug("[ArtworkCache] 🔍 Trying Clearbit:", url);
  const result = await validateImage(url);
  console.debug("[ArtworkCache] Clearbit result:", result, "for", domain);
  return result === "OK" ? url : null;
}


const LASTFM_API_KEY = "f0549ea17c34cc54c672676e791f616b";

async function tryLastFm(stationName: string): Promise<string | null> {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(stationName)}&api_key=${LASTFM_API_KEY}&format=json`;
    console.debug("[ArtworkCache] 🔍 Trying Last.fm for:", stationName);
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) { console.debug("[ArtworkCache] Last.fm HTTP", res.status); return null; }
    const data = await res.json();
    const images = data?.artist?.image;
    if (!Array.isArray(images)) { console.debug("[ArtworkCache] Last.fm: no images for", stationName); return null; }
    const mega = images.find((i: any) => i.size === "mega")?.["#text"];
    const xl = images.find((i: any) => i.size === "extralarge")?.["#text"];
    const candidate = mega || xl;
    if (!candidate || candidate.includes("2a96cbd8b46e442fc41c2b86b821562f")) {
      console.debug("[ArtworkCache] Last.fm: no valid image for", stationName);
      return null;
    }
    console.debug("[ArtworkCache] Last.fm candidate:", candidate);
    const result = await validateImage(candidate);
    console.debug("[ArtworkCache] Last.fm validation:", result);
    return result === "OK" ? candidate : null;
  } catch (e) {
    console.warn("[ArtworkCache] Last.fm error:", e);
    return null;
  }
}

async function resolveHdArtwork(
  originalUrl: string,
  homepage: string,
  stationName: string,
): Promise<string> {
  // Source A — Clearbit
  if (homepage) {
    const clearbitUrl = await tryClearbit(homepage);
    if (clearbitUrl) return clearbitUrl;
  }

  // Source B — Last.fm
  if (stationName) {
    const lastFmUrl = await tryLastFm(stationName);
    if (lastFmUrl) return lastFmUrl;
  }

  // Source C — Local placeholder
  return stationPlaceholder;
}

// ── Core resolution logic (singleton per station) ──────────────────
async function resolveStation(
  stationId: string,
  originalUrl: string,
  homepage: string,
  stationName: string,
): Promise<string> {
  // Keep original URL as-is (don't force https — breaks many radio favicons)
  const workingUrl = originalUrl || "";

  // 1. Already persisted? (skip if it's the placeholder — re-check for better art)
  const persisted = loadPersistedCache();
  const persistedUrl = persisted[stationId];
  if (persistedUrl && !persistedUrl.includes("station-placeholder")) {
    console.debug("[ArtworkCache] 💾 Cache hit for", stationName || stationId, "→", persistedUrl);
    const entry: CacheEntry = {
      status: "RESOLVED",
      resolvedUrl: persistedUrl,
      checked: true,
    };
    memoryCache.set(stationId, entry);
    notify();
    return entry.resolvedUrl;
  }

  // 2. Mark as checking
  memoryCache.set(stationId, { status: "CHECKING", resolvedUrl: workingUrl || stationPlaceholder, checked: false });
  notify();

  // 3. Validate original
  const quality = await validateImage(workingUrl);

  let finalUrl: string;
  if (quality === "OK") {
    finalUrl = workingUrl;
  } else {
    finalUrl = await resolveHdArtwork(workingUrl, homepage, stationName);
  }

  // 4. Store
  const entry: CacheEntry = { status: "RESOLVED", resolvedUrl: finalUrl, checked: true };
  memoryCache.set(stationId, entry);
  persistEntry(stationId, finalUrl);
  notify();
  return finalUrl;
}

// ── Public hook ────────────────────────────────────────────────────
export function useArtworkCache(
  stationId: string,
  originalUrl: string,
  homepage: string = "",
  stationName: string = "",
) {
  // Trigger resolution once (idempotent via inflightChecks)
  const startedRef = useRef(false);
  if (!startedRef.current && stationId) {
    startedRef.current = true;
    if (!inflightChecks.has(stationId) && !memoryCache.get(stationId)?.checked) {
      const p = resolveStation(stationId, originalUrl, homepage, stationName);
      inflightChecks.set(stationId, p);
      p.finally(() => inflightChecks.delete(stationId));
    }
  }

  const getSnapshot = useCallback(() => {
    return memoryCache.get(stationId) ?? {
      status: "PENDING" as const,
      resolvedUrl: originalUrl?.replace("http://", "https://") || stationPlaceholder,
      checked: false,
    };
  }, [stationId, originalUrl]);

  const entry = useSyncExternalStore(subscribe, getSnapshot);

  return {
    src: entry.resolvedUrl,
    isLoading: entry.status === "CHECKING" || entry.status === "PENDING",
    isResolved: entry.status === "RESOLVED",
  };
}

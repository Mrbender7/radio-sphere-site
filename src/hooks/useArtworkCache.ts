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
const MIN_DIMENSION = 100; // lowered — 200x200 brand icons are fine
const MIN_BYTES = 5_000; // 5 KB

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
function isTrustedCdn(url: string): boolean {
  return url.includes("cdn.brandfetch.io");
}

function validateImage(url: string): Promise<"OK" | "LOW_QUALITY" | "ERROR"> {
  return new Promise((resolve) => {
    if (!url) { resolve("ERROR"); return; }

    // Trust CDN sources — skip expensive HEAD + dimension checks
    if (isTrustedCdn(url)) {
      console.debug("[ArtworkCache] ✅ Trusted CDN, skipping validation:", url);
      resolve("OK");
      return;
    }

    const timeout = setTimeout(() => {
      console.warn("[ArtworkCache] ⏱ Timeout validating:", url);
      resolve("ERROR");
    }, 8000);

    const img = new Image();
    img.onload = () => {
      clearTimeout(timeout);
      if (img.naturalWidth < MIN_DIMENSION || img.naturalHeight < MIN_DIMENSION) {
        console.debug("[ArtworkCache] 📐 LOW_QUALITY (dimensions):", url, img.naturalWidth, "x", img.naturalHeight);
        resolve("LOW_QUALITY");
        return;
      }
      console.debug("[ArtworkCache] ✅ OK:", url);
      resolve("OK");
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
const STRIP_PREFIXES = /^(www\.|radios?\.|stream\.|live\.|icecast\.|player\.|listen\.|webradio\.|audio\.)/;

function extractDomain(homepage: string): string | null {
  try {
    const hostname = new URL(homepage).hostname;
    return hostname.replace(STRIP_PREFIXES, "");
  } catch {
    return null;
  }
}

const BRANDFETCH_API_KEY = "jMd9rG1P6leKiThV1-l39e-bSBb58sbk-opFE4JxgvT_VSMpHdi7BD-JN8DKXfcfcipIeb7kiPxC9Wx174OfPw";

// Domain-level dedup for Brandfetch (avoid calling same domain multiple times)
const brandfetchDomainCache = new Map<string, Promise<string | null>>();

async function tryBrandfetch(homepage: string): Promise<string | null> {
  const domain = extractDomain(homepage);
  if (!domain) return null;

  // Deduplicate by domain
  if (brandfetchDomainCache.has(domain)) {
    return brandfetchDomainCache.get(domain)!;
  }

  const promise = (async (): Promise<string | null> => {
    try {
      const url = `https://api.brandfetch.io/v2/brands/${domain}`;
      console.debug("[ArtworkCache] 🔍 Trying Brandfetch:", domain);
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${BRANDFETCH_API_KEY}` },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) { console.debug("[ArtworkCache] Brandfetch HTTP", res.status); return null; }
      const data = await res.json();
      const logos = data?.logos ?? [];
      let bestUrl: string | null = null;
      for (const type of ["icon", "logo"]) {
        const logo = logos.find((l: any) => l.type === type);
        if (logo?.formats?.length) {
          const sorted = [...logo.formats].sort((a: any, b: any) => {
            const order: Record<string, number> = { png: 0, jpeg: 1, jpg: 1, svg: 2 };
            return (order[a.format] ?? 9) - (order[b.format] ?? 9);
          });
          bestUrl = sorted[0]?.src ?? null;
          if (bestUrl) break;
        }
      }
      if (!bestUrl) { console.debug("[ArtworkCache] Brandfetch: no logo for", domain); return null; }
      console.debug("[ArtworkCache] ✅ Brandfetch found:", bestUrl);
      return bestUrl;
    } catch (e) {
      console.warn("[ArtworkCache] Brandfetch error:", e);
      return null;
    }
  })();

  brandfetchDomainCache.set(domain, promise);
  return promise;
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
  // Source A — Brandfetch
  if (homepage) {
    const brandfetchUrl = await tryBrandfetch(homepage);
    if (brandfetchUrl) return brandfetchUrl;
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
      resolvedUrl: originalUrl || stationPlaceholder,
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

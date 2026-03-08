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
const STRIP_PREFIXES = [
  "www",
  "radios",
  "radio",
  "stream",
  "live",
  "icecast",
  "player",
  "listen",
  "webradio",
  "audio",
];

function extractDomain(homepage: string): string | null {
  try {
    let hostname = new URL(homepage).hostname.toLowerCase();

    // Remove common noisy subdomains repeatedly (ex: www.stream.rtbf.be → rtbf.be)
    let changed = true;
    while (changed) {
      changed = false;
      for (const prefix of STRIP_PREFIXES) {
        const token = `${prefix}.`;
        if (hostname.startsWith(token)) {
          hostname = hostname.slice(token.length);
          changed = true;
        }
      }
    }

    return hostname || null;
  } catch {
    return null;
  }
}

const BRANDFETCH_API_KEY = "uy994hGSIB15nIu5lPKp3FQw6IMsaeC2qScvf9pN__baJvw-NC08JWVu4G_-_S5AGw6czXl9mbTK3xYrNCeEZQ";

// Domain-level dedup for Brandfetch (avoid calling same domain multiple times)
const brandfetchDomainCache = new Map<string, Promise<string | null>>();

function probeImage(url: string, timeoutMs = 4500): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }

    const img = new Image();
    const timeout = setTimeout(() => resolve(false), timeoutMs);

    img.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };

    img.src = url;
  });
}

async function tryBrandfetch(homepage: string): Promise<string | null> {
  const domain = extractDomain(homepage);
  if (!domain) return null;

  // Deduplicate by domain
  if (brandfetchDomainCache.has(domain)) {
    return brandfetchDomainCache.get(domain)!;
  }

  const promise = (async (): Promise<string | null> => {
    try {
      // Expected format example: https://cdn.brandfetch.io/rtbf.be?c=CLIENT_ID
      const cdnUrl = `https://cdn.brandfetch.io/${domain}?c=${BRANDFETCH_API_KEY}`;
      console.debug("[ArtworkCache] 🔍 Trying Brandfetch CDN:", cdnUrl);

      const exists = await probeImage(cdnUrl);
      if (!exists) {
        console.debug("[ArtworkCache] Brandfetch: no logo for", domain);
        return null;
      }

      console.debug("[ArtworkCache] ✅ Brandfetch found:", cdnUrl);
      return cdnUrl;
    } catch (e) {
      console.warn("[ArtworkCache] Brandfetch error:", e);
      return null;
    }
  })();

  brandfetchDomainCache.set(domain, promise);
  return promise;
}

const LASTFM_API_KEY = "f0549ea17c34cc54c672676e791f616b";

function isLastFmPlaceholder(url: string): boolean {
  return !url || url.includes("2a96cbd8b46e442fc41c2b86b821562f");
}

function pickLastFmImage(images: any): string | null {
  if (!Array.isArray(images)) return null;

  const bySize = ["mega", "extralarge", "large", "medium", "small"];
  for (const size of bySize) {
    const candidate = images.find((i: any) => i?.size === size)?.["#text"];
    if (typeof candidate === "string" && !isLastFmPlaceholder(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function tryLastFmGetInfo(stationName: string): Promise<string | null> {
  const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(stationName)}&api_key=${LASTFM_API_KEY}&format=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;

  const data = await res.json();
  return pickLastFmImage(data?.artist?.image);
}

async function tryLastFmSearch(stationName: string): Promise<string | null> {
  const url = `https://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${encodeURIComponent(stationName)}&limit=5&api_key=${LASTFM_API_KEY}&format=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;

  const data = await res.json();
  const artistsRaw = data?.results?.artistmatches?.artist;
  const artists = Array.isArray(artistsRaw) ? artistsRaw : artistsRaw ? [artistsRaw] : [];

  let fallbackArtistName: string | null = null;
  for (const artist of artists) {
    const image = pickLastFmImage(artist?.image);
    if (image) return image;
    if (!fallbackArtistName && typeof artist?.name === "string") {
      fallbackArtistName = artist.name;
    }
  }

  if (!fallbackArtistName) return null;
  return tryLastFmGetInfo(fallbackArtistName);
}

function buildLastFmCandidates(stationName: string): string[] {
  const fullName = stationName.trim();
  if (!fullName) return [];

  const cleaned = fullName
    .replace(/\s*-\s*channel\s*\d+$/i, "")
    .replace(/\s*-\s*live$/i, "")
    .replace(/\s*\|.*$/, "")
    .replace(/^\.+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return [...new Set([fullName, cleaned].filter(Boolean))];
}

async function tryLastFm(stationName: string): Promise<string | null> {
  try {
    const candidates = buildLastFmCandidates(stationName);

    // Priority: full station name first (ex: "RTBF La Première")
    for (const candidate of candidates) {
      console.debug("[ArtworkCache] 🔍 Trying Last.fm getinfo:", candidate);
      const direct = await tryLastFmGetInfo(candidate);
      if (direct) return direct;
    }

    for (const candidate of candidates) {
      console.debug("[ArtworkCache] 🔍 Trying Last.fm search:", candidate);
      const searched = await tryLastFmSearch(candidate);
      if (searched) return searched;
    }

    console.debug("[ArtworkCache] Last.fm: no valid image for", stationName);
    return null;
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

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

// Rate-limiter: max N concurrent Brandfetch calls
const MAX_CONCURRENT_BRANDFETCH = 3;
let activeBrandfetch = 0;
const brandfetchQueue: Array<() => void> = [];

function acquireBrandfetchSlot(): Promise<void> {
  if (activeBrandfetch < MAX_CONCURRENT_BRANDFETCH) {
    activeBrandfetch++;
    return Promise.resolve();
  }
  return new Promise((resolve) => brandfetchQueue.push(resolve));
}

function releaseBrandfetchSlot() {
  activeBrandfetch--;
  const next = brandfetchQueue.shift();
  if (next) {
    activeBrandfetch++;
    next();
  }
}

// Backoff global: après un 429, pause temporaire au lieu de désactiver toute la session
const BRANDFETCH_COOLDOWN_MS = 60_000;
let brandfetchCooldownUntil = 0;

function isBrandfetchCoolingDown(): boolean {
  return Date.now() < brandfetchCooldownUntil;
}

async function tryBrandfetch(homepage: string): Promise<string | null> {
  if (isBrandfetchCoolingDown()) return null;

  const domain = extractDomain(homepage);
  if (!domain) return null;

  // Deduplicate by domain
  if (brandfetchDomainCache.has(domain)) {
    return brandfetchDomainCache.get(domain)!;
  }

  let shouldKeepDomainCache = true;

  const promise = (async (): Promise<string | null> => {
    await acquireBrandfetchSlot();
    try {
      if (isBrandfetchCoolingDown()) return null;

      const url = `https://api.brandfetch.io/v2/brands/${domain}`;
      console.debug("[ArtworkCache] 🔍 Trying Brandfetch API:", domain);
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${BRANDFETCH_API_KEY}` },
        signal: AbortSignal.timeout(6000),
      });

      if (res.status === 429) {
        const retryAfterSec = Number(res.headers.get("retry-after") || "0");
        const waitMs = Number.isFinite(retryAfterSec) && retryAfterSec > 0
          ? retryAfterSec * 1000
          : BRANDFETCH_COOLDOWN_MS;

        brandfetchCooldownUntil = Date.now() + waitMs;
        shouldKeepDomainCache = false; // 429 = transitoire, autoriser un retry futur
        console.warn("[ArtworkCache] ⛔ Brandfetch rate-limited — cooldown", Math.round(waitMs / 1000), "s");
        return null;
      }

      if (!res.ok) {
        console.debug("[ArtworkCache] Brandfetch HTTP", res.status, "for", domain);
        return null;
      }

      const data = await res.json();
      const logos = data?.logos ?? [];
      let bestUrl: string | null = null;

      // Prefer icon (square), then logo; prefer png/jpeg over svg
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

      if (!bestUrl) {
        console.debug("[ArtworkCache] Brandfetch: no logo for", domain);
        return null;
      }

      console.debug("[ArtworkCache] ✅ Brandfetch found:", bestUrl);
      return bestUrl;
    } catch (e) {
      console.warn("[ArtworkCache] Brandfetch error:", e);
      return null;
    } finally {
      releaseBrandfetchSlot();
    }
  })();

  brandfetchDomainCache.set(domain, promise);
  promise.finally(() => {
    if (!shouldKeepDomainCache) {
      brandfetchDomainCache.delete(domain);
    }
  });

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

  const canonical = cleaned
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b\d{2,3}(?:\.\d+)?\b/g, " ")
    .replace(/\s*-\s*[^|]+$/g, " ")
    .replace(/\b(?:fm|radio|webradio|stream|live|official|belgium|belgië)\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  const firstSegment = cleaned.split(" - ")[0]?.trim() ?? "";
  const brandHints: string[] = [];

  if (/classic\s*21/i.test(fullName)) {
    brandHints.push("Classic 21", "RTBF Classic 21");
  }
  if (/\brtbf\b/i.test(fullName)) {
    brandHints.push("RTBF");
  }
  if (/\bnrj\b/i.test(fullName)) {
    brandHints.push("NRJ");
  }

  return [...new Set([fullName, cleaned, canonical, firstSegment, ...brandHints].filter(Boolean))];
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
): Promise<string | null> {
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

  // Aucun HD trouvé
  return null;
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

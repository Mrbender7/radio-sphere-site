import { useCallback, useRef, useSyncExternalStore } from "react";
import stationPlaceholder from "@/assets/station-placeholder.png";

// ── Types ──────────────────────────────────────────────────────────
type ArtworkStatus = "PENDING" | "CHECKING" | "RESOLVED";

interface CacheEntry {
  status: ArtworkStatus;
  resolvedUrl: string;
  isLowQuality: boolean;
  checked: boolean;
}

// ── Settings ───────────────────────────────────────────────────────
const SETTINGS_KEY = "radiosphere_replace_low_quality";

export function getReplaceLowQuality(): boolean {
  try {
    return localStorage.getItem(SETTINGS_KEY) === "true";
  } catch {
    return false;
  }
}

export function setReplaceLowQuality(value: boolean) {
  try {
    localStorage.setItem(SETTINGS_KEY, String(value));
    // Re-evaluate all cached entries
    reapplyQualitySetting();
  } catch { /* non-critical */ }
}

// ── In-memory store (shared across all hook instances) ─────────────
const STORAGE_KEY = "radiosphere_artwork_cache";
const QUALITY_KEY = "radiosphere_artwork_quality"; // persists quality info per station
const MIN_DIMENSION = 100;

const memoryCache = new Map<string, CacheEntry>();
const listeners = new Set<() => void>();
const inflightChecks = new Map<string, Promise<void>>();

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
  } catch { /* quota exceeded */ }
}

function loadQualityMap(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(QUALITY_KEY) || "{}");
  } catch {
    return {};
  }
}

function persistQuality(stationId: string, isLowQuality: boolean) {
  try {
    const map = loadQualityMap();
    map[stationId] = isLowQuality;
    localStorage.setItem(QUALITY_KEY, JSON.stringify(map));
  } catch { /* non-critical */ }
}

// ── Re-apply setting when toggle changes ───────────────────────────
function reapplyQualitySetting() {
  const replace = getReplaceLowQuality();
  let changed = false;

  for (const [id, entry] of memoryCache) {
    if (!entry.checked) continue;
    if (entry.isLowQuality) {
      const originalUrl = loadPersistedCache()[id] || "";
      const newUrl = replace ? stationPlaceholder : (originalUrl || stationPlaceholder);
      if (entry.resolvedUrl !== newUrl) {
        entry.resolvedUrl = newUrl;
        changed = true;
      }
    }
  }

  if (changed) notify();
}

// ── Image validation ───────────────────────────────────────────────
function validateImage(url: string): Promise<"OK" | "LOW_QUALITY" | "ERROR"> {
  return new Promise((resolve) => {
    if (!url) { resolve("ERROR"); return; }

    const timeout = setTimeout(() => {
      resolve("ERROR");
    }, 8000);

    const img = new Image();
    img.onload = () => {
      clearTimeout(timeout);
      if (img.naturalWidth < MIN_DIMENSION || img.naturalHeight < MIN_DIMENSION) {
        resolve("LOW_QUALITY");
        return;
      }
      resolve("OK");
    };
    img.onerror = () => {
      clearTimeout(timeout);
      resolve("ERROR");
    };
    img.src = url;
  });
}

// ── Core resolution logic ──────────────────────────────────────────
async function resolveStation(
  stationId: string,
  originalUrl: string,
): Promise<void> {
  const workingUrl = originalUrl || "";
  const replaceSetting = getReplaceLowQuality();

  // 1. Check persisted quality info
  const qualityMap = loadQualityMap();
  if (stationId in qualityMap) {
    const isLow = qualityMap[stationId];
    const url = (isLow && replaceSetting) ? stationPlaceholder : (workingUrl || stationPlaceholder);
    const entry: CacheEntry = { status: "RESOLVED", resolvedUrl: url, isLowQuality: isLow, checked: true };
    memoryCache.set(stationId, entry);
    notify();
    return;
  }

  // 2. Mark as checking
  memoryCache.set(stationId, { status: "CHECKING", resolvedUrl: workingUrl || stationPlaceholder, isLowQuality: false, checked: false });
  notify();

  // 3. Validate original
  const quality = await validateImage(workingUrl);
  const isLowQuality = quality !== "OK";

  let finalUrl: string;
  if (quality === "OK") {
    finalUrl = workingUrl;
  } else if (isLowQuality && replaceSetting) {
    finalUrl = stationPlaceholder;
  } else if (quality === "LOW_QUALITY" && workingUrl) {
    // Keep the low-quality image as-is
    finalUrl = workingUrl;
  } else {
    finalUrl = stationPlaceholder;
  }

  // 4. Store
  const entry: CacheEntry = { status: "RESOLVED", resolvedUrl: finalUrl, isLowQuality, checked: true };
  memoryCache.set(stationId, entry);
  persistEntry(stationId, workingUrl); // persist original URL, not placeholder
  persistQuality(stationId, isLowQuality);
  notify();
}

// ── Public hook ────────────────────────────────────────────────────
export function useArtworkCache(
  stationId: string,
  originalUrl: string,
  _homepage: string = "",
  _stationName: string = "",
) {
  const startedRef = useRef(false);
  if (!startedRef.current && stationId) {
    startedRef.current = true;
    if (!inflightChecks.has(stationId) && !memoryCache.get(stationId)?.checked) {
      const p = resolveStation(stationId, originalUrl);
      inflightChecks.set(stationId, p);
      p.finally(() => inflightChecks.delete(stationId));
    }
  }

  const getSnapshot = useCallback(() => {
    return memoryCache.get(stationId) ?? {
      status: "PENDING" as const,
      resolvedUrl: originalUrl || stationPlaceholder,
      isLowQuality: false,
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

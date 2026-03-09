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
    reapplyQualitySetting();
  } catch { /* non-critical */ }
}

// ── In-memory store ────────────────────────────────────────────────
const STORAGE_KEY = "radiosphere_artwork_cache";
const QUALITY_KEY = "radiosphere_artwork_quality";
const MIN_DIMENSION = 100;

const memoryCache = new Map<string, CacheEntry>();
const listeners = new Set<() => void>();
const inflightChecks = new Set<string>(); // Simplifié, on stocke juste l'ID

// ── GESTION DE LA FILE D'ATTENTE (QUEUE) ───────────────────────────
const imageQueue: Array<() => Promise<void>> = [];
const MAX_CONCURRENT_DOWNLOADS = 2; // On laisse le réseau libre pour le flux audio !
let activeDownloads = 0;

async function processQueue() {
  if (activeDownloads >= MAX_CONCURRENT_DOWNLOADS || imageQueue.length === 0) {
    return;
  }
  
  activeDownloads++;
  const task = imageQueue.shift();
  
  if (task) {
    await task();
  }
  
  activeDownloads--;
  processQueue(); // On lance le suivant
}

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

// Écriture différée pour ne pas bloquer le thread principal (UI Jank)
function persistEntry(stationId: string, url: string) {
  setTimeout(() => {
    try {
      const store = loadPersistedCache();
      store[stationId] = url;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch { /* quota exceeded */ }
  }, 0);
}

function loadQualityMap(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(QUALITY_KEY) || "{}");
  } catch {
    return {};
  }
}

// Écriture différée
function persistQuality(stationId: string, isLowQuality: boolean) {
  setTimeout(() => {
    try {
      const map = loadQualityMap();
      map[stationId] = isLowQuality;
      localStorage.setItem(QUALITY_KEY, JSON.stringify(map));
    } catch { /* non-critical */ }
  }, 0);
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

// ── Core resolution logic (Optimisée avec Queue) ───────────────────
function resolveStation(stationId: string, originalUrl: string) {
  const workingUrl = originalUrl || "";
  const replaceSetting = getReplaceLowQuality();

  // 1. Vérification rapide et synchrone dans le cache persistant
  const qualityMap = loadQualityMap();
  if (stationId in qualityMap) {
    const isLow = qualityMap[stationId];
    const url = (isLow && replaceSetting) ? stationPlaceholder : (workingUrl || stationPlaceholder);
    const entry: CacheEntry = { status: "RESOLVED", resolvedUrl: url, isLowQuality: isLow, checked: true };
    memoryCache.set(stationId, entry);
    notify();
    inflightChecks.delete(stationId);
    return;
  }

  // 2. On marque comme "en cours de vérification" pour l'UI
  memoryCache.set(stationId, { status: "CHECKING", resolvedUrl: workingUrl || stationPlaceholder, isLowQuality: false, checked: false });
  notify();

  // 3. On place la lourde tâche réseau dans la file d'attente
  imageQueue.push(async () => {
    const quality = await validateImage(workingUrl);
    const isLowQuality = quality !== "OK";

    let finalUrl: string;
    if (quality === "OK") {
      finalUrl = workingUrl;
    } else if (isLowQuality && replaceSetting) {
      finalUrl = stationPlaceholder;
    } else if (quality === "LOW_QUALITY" && workingUrl) {
      finalUrl = workingUrl;
    } else {
      finalUrl = stationPlaceholder;
    }

    // 4. Mise à jour de la mémoire et sauvegarde différée
    const entry: CacheEntry = { status: "RESOLVED", resolvedUrl: finalUrl, isLowQuality, checked: true };
    memoryCache.set(stationId, entry);
    
    persistEntry(stationId, workingUrl);
    persistQuality(stationId, isLowQuality);
    
    inflightChecks.delete(stationId);
    notify();
  });

  // On lance le traitement de la file d'attente avec un léger délai
  // Cela permet au lecteur audio (qui est prioritaire) de lancer son Fetch d'abord !
  setTimeout(() => {
    processQueue();
  }, 500);
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
    
    // Si la station n'est pas déjà en cours de résolution et n'a pas été vérifiée
    if (!inflightChecks.has(stationId) && !memoryCache.get(stationId)?.checked) {
      inflightChecks.add(stationId);
      resolveStation(stationId, originalUrl);
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

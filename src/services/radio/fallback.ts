/**
 * GitHub static fallback for Radio Browser API
 * Fetches and caches a static stations dump, provides client-side search/filter.
 */

import { RadioStation } from "@/types/radio";

const FALLBACK_URL =
  "https://raw.githubusercontent.com/Mrbender7/RadioBrowserAPIBackup/refs/heads/main/data/stations.json";

const FALLBACK_FETCH_TIMEOUT_MS = 15_000;

/** In-memory cache of the full fallback dataset (fetched once per session) */
let fallbackCache: RadioStation[] | null = null;
let fallbackFetchPromise: Promise<RadioStation[]> | null = null;

function normalizeStation(raw: any): RadioStation {
  return {
    id: raw.stationuuid || raw.id || "",
    name: raw.name || "Unknown",
    streamUrl: raw.url_resolved || raw.url || "",
    logo: raw.favicon || "",
    country: raw.country || "",
    countryCode: raw.countrycode || "",
    tags: raw.tags
      ? raw.tags
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean)
      : [],
    language: raw.language || "",
    codec: raw.codec || "",
    bitrate: raw.bitrate || 0,
    votes: raw.votes || 0,
    clickcount: raw.clickcount || 0,
    homepage: raw.homepage || "",
  };
}

/** Fetch and cache the full fallback dataset */
async function loadFallbackData(): Promise<RadioStation[]> {
  if (fallbackCache) return fallbackCache;
  if (fallbackFetchPromise) return fallbackFetchPromise;

  fallbackFetchPromise = (async () => {
    console.warn("[RadioService] ⚠ Loading fallback station database from GitHub...");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FALLBACK_FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(FALLBACK_URL, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Always read as text first — service workers / WebViews can return HTML
      // interstitials with a JSON content-type. Never trust the header alone.
      let text: string;
      try {
        text = await res.text();
      } catch (e) {
        throw new Error(`[RadioService] Failed to read fallback body: ${e instanceof Error ? e.message : String(e)}`);
      }

      const trimmed = text.trim();
      if (!trimmed) {
        throw new Error(`[RadioService] Empty fallback body`);
      }
      if (trimmed.startsWith("<!") || trimmed.startsWith("<html") || trimmed.startsWith("<HTML")) {
        throw new Error(`[RadioService] HTML response from fallback URL (likely WebView interstitial / poisoned cache)`);
      }

      let raw: unknown;
      try {
        raw = JSON.parse(trimmed);
      } catch (e) {
        throw new Error(`[RadioService] Fallback JSON parse failed: ${e instanceof Error ? e.message : String(e)}`);
      }

      if (!Array.isArray(raw)) {
        throw new Error(`[RadioService] Fallback expected array, got ${typeof raw}`);
      }
      const stations = (raw as any[])
        .map(normalizeStation)
        .filter((s) => s.streamUrl && s.name);

      fallbackCache = stations;
      console.log(`[RadioService] ✓ Fallback loaded: ${stations.length} stations`);
      return stations;
    } catch (e) {
      clearTimeout(timer);
      fallbackFetchPromise = null; // allow retry
      throw e;
    }
  })();

  return fallbackFetchPromise;
}

/** Sort stations by a field */
function sortStations(
  stations: RadioStation[],
  order: string = "votes",
  reverse: boolean = true
): RadioStation[] {
  const sorted = [...stations];
  sorted.sort((a, b) => {
    switch (order) {
      case "name":
        return a.name.localeCompare(b.name);
      case "clickcount":
        return a.clickcount - b.clickcount;
      case "votes":
      default:
        return a.votes - b.votes;
    }
  });
  if (reverse) sorted.reverse();
  return sorted;
}

/** Client-side search over the fallback dataset */
export async function fallbackSearchStations(params: {
  name?: string;
  country?: string;
  tag?: string;
  tagList?: string;
  language?: string;
  limit?: number;
  offset?: number;
  order?: string;
  reverse?: string;
}): Promise<RadioStation[]> {
  const all = await loadFallbackData();

  let results = all;

  // Filter by name (case-insensitive substring)
  if (params.name) {
    const q = params.name.toLowerCase();
    results = results.filter((s) => s.name.toLowerCase().includes(q));
  }

  // Filter by country (case-insensitive exact or substring)
  if (params.country) {
    const c = params.country.toLowerCase();
    results = results.filter(
      (s) =>
        s.country.toLowerCase() === c ||
        s.countryCode.toLowerCase() === c ||
        s.country.toLowerCase().includes(c)
    );
  }

  // Filter by single tag
  if (params.tag) {
    const t = params.tag.toLowerCase();
    results = results.filter((s) =>
      s.tags.some((tag) => tag.toLowerCase() === t || tag.toLowerCase().includes(t))
    );
  }

  // Filter by tagList (comma-separated, any match)
  if (params.tagList) {
    const tags = params.tagList
      .toLowerCase()
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    results = results.filter((s) =>
      tags.some((t) =>
        s.tags.some((st) => st.toLowerCase() === t || st.toLowerCase().includes(t))
      )
    );
  }

  // Filter by language
  if (params.language) {
    const l = params.language.toLowerCase();
    results = results.filter((s) => s.language.toLowerCase().includes(l));
  }

  // Sort
  const order = params.order || "votes";
  const reverse = params.reverse !== "false";
  results = sortStations(results, order, reverse);

  // Paginate
  const offset = params.offset || 0;
  const limit = params.limit || 30;
  return results.slice(offset, offset + limit);
}

/** Get top stations from fallback (sorted by votes) */
export async function fallbackGetTopStations(limit = 20): Promise<RadioStation[]> {
  const all = await loadFallbackData();
  return sortStations(all, "votes", true).slice(0, limit);
}

/** Get stations by tag from fallback */
export async function fallbackGetStationsByTag(
  tag: string,
  limit = 20
): Promise<RadioStation[]> {
  return fallbackSearchStations({ tag, limit, order: "votes", reverse: "true" });
}

/** Get stations by country from fallback */
export async function fallbackGetStationsByCountry(
  country: string,
  limit = 20
): Promise<RadioStation[]> {
  return fallbackSearchStations({ country, limit, order: "votes", reverse: "true" });
}

/** Get countries from fallback data */
export async function fallbackGetCountries(): Promise<
  { name: string; iso_3166_1: string; stationcount: number }[]
> {
  const all = await loadFallbackData();
  const countryMap = new Map<string, { name: string; iso_3166_1: string; count: number }>();

  for (const s of all) {
    if (!s.country || !s.countryCode) continue;
    const key = s.countryCode.toUpperCase();
    const existing = countryMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      countryMap.set(key, { name: s.country, iso_3166_1: key, count: 1 });
    }
  }

  return Array.from(countryMap.values())
    .map((c) => ({ name: c.name, iso_3166_1: c.iso_3166_1, stationcount: c.count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Search station by URL from fallback */
export async function fallbackSearchStationByUrl(
  streamUrl: string
): Promise<RadioStation | null> {
  const all = await loadFallbackData();
  return all.find((s) => s.streamUrl === streamUrl) || null;
}

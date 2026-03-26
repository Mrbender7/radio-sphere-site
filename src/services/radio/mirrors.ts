/**
 * Mirror management for Radio Browser API
 */

const FALLBACK_MIRRORS = [
  "https://all.api.radio-browser.info",
  "https://de1.api.radio-browser.info",
  "https://fr1.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
  "https://fi1.api.radio-browser.info",
];

export const USER_AGENT = "RadioSphere/1.0";
export const REQUEST_TIMEOUT_MS = 5000;
const MAX_MIRROR_ATTEMPTS = 6;

// Session-level mirror state
let cachedWorkingMirror: string | null = null;
let dynamicMirrors: string[] | null = null;
let mirrorFetchPromise: Promise<string[]> | null = null;
const blacklistedMirrors = new Map<string, number>();
const BLACKLIST_DURATION_MS = 60_000;

function isBlacklisted(mirror: string): boolean {
  const expiry = blacklistedMirrors.get(mirror);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    blacklistedMirrors.delete(mirror);
    return false;
  }
  return true;
}

function blacklistMirror(mirror: string) {
  blacklistedMirrors.set(mirror, Date.now() + BLACKLIST_DURATION_MS);
}

/** Safe JSON fetch: validates content-type, detects HTML error pages, ensures array response */
async function fetchJsonArray<T = any>(url: string, options?: RequestInit): Promise<T[]> {
  const res = await fetch(url, options);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }

  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("application/json") && !contentType.includes("text/json")) {
    const text = await res.text();
    if (text.trim().startsWith("<!") || text.includes("<html")) {
      throw new Error(`[RadioService] HTML response instead of JSON from ${url} (Cloudflare/auth wall)`);
    }
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Not an array");
      return parsed;
    } catch {
      throw new Error(`[RadioService] Unexpected format from ${url}: ${contentType}`);
    }
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error(`[RadioService] Expected array but got ${typeof data} from ${url}`);
  }
  return data;
}

/** Create a timeout-compatible AbortSignal, merging with an optional external signal */
function createTimeoutSignal(externalSignal?: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  controller.signal.addEventListener("abort", () => clearTimeout(timer), { once: true });
  return controller.signal;
}

/** Fetch dynamic mirror list from Radio Browser */
async function fetchDynamicMirrors(): Promise<string[]> {
  try {
    const signal = createTimeoutSignal();
    const data = await fetchJsonArray<{ name: string; ip: string }>(
      "https://all.api.radio-browser.info/json/servers",
      { signal }
    );
    const urls = data
      .map((s: any) => `https://${s.name}`)
      .filter((u: string) => u.includes("api.radio-browser.info"));

    const merged = [...FALLBACK_MIRRORS, ...urls.filter((u: string) => !FALLBACK_MIRRORS.includes(u))];
    return merged;
  } catch (e) {
    console.warn("[RadioService] Dynamic mirror fetch failed, using fallbacks:", e);
    return FALLBACK_MIRRORS;
  }
}

/** Get mirrors, fetching dynamic list once per session */
async function getMirrors(): Promise<string[]> {
  if (dynamicMirrors) return dynamicMirrors;
  if (!mirrorFetchPromise) {
    mirrorFetchPromise = fetchDynamicMirrors().then(mirrors => {
      dynamicMirrors = mirrors;
      return mirrors;
    });
  }
  return mirrorFetchPromise;
}

/** Fetch from mirrors with prioritization, blacklisting, and bounded attempts */
export async function fetchWithMirrors(path: string, params?: Record<string, string>, externalSignal?: AbortSignal): Promise<any[]> {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  const allMirrors = await getMirrors();

  const available = allMirrors.filter(m => !isBlacklisted(m));
  if (available.length === 0) {
    blacklistedMirrors.clear();
    available.push(...allMirrors);
  }

  const mirrors = cachedWorkingMirror && available.includes(cachedWorkingMirror)
    ? [cachedWorkingMirror, ...available.filter(m => m !== cachedWorkingMirror)]
    : available;

  const toTry = mirrors.slice(0, Math.min(MAX_MIRROR_ATTEMPTS, mirrors.length));

  let lastError: Error | null = null;
  for (const mirror of toTry) {
    if (externalSignal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    try {
      const signal = createTimeoutSignal(externalSignal);
      const url = `${mirror}/json/${path}${query}`;
      const data = await fetchJsonArray(url, {
        headers: { "User-Agent": USER_AGENT },
        signal,
      });
      cachedWorkingMirror = mirror;
      console.debug(`[RadioService] ✓ ${mirror} for ${path}`);
      return data;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      if (err.name === "AbortError" && externalSignal?.aborted) {
        throw err;
      }
      console.warn(`[RadioService] ✗ ${mirror} for ${path}:`, err.message);
      blacklistMirror(mirror);
      lastError = err;
    }
  }

  throw lastError || new Error("[RadioService] All mirrors failed");
}

export function getCachedWorkingMirror(): string {
  return cachedWorkingMirror || FALLBACK_MIRRORS[0];
}

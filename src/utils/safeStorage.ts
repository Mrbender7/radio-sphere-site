/**
 * Defensive wrappers around Web Storage APIs.
 *
 * In-app browsers (Facebook, Instagram, TikTok, …) frequently:
 *  - throw on `localStorage.setItem` (partitioned/quota=0)
 *  - return `null` from `getItem` even after a successful `setItem`
 *  - throw on `localStorage.clear()` after the first restricted access
 *
 * Any uncaught throw inside a render path takes the whole React tree down
 * and produces the dreaded "clear cache & reload" screen for visitors
 * coming from `l.facebook.com` / `lm.facebook.com`. Always go through
 * these helpers instead of touching `localStorage` directly.
 */

export function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: string): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function safeClearAll(): boolean {
  let ok = true;
  try { localStorage?.clear(); } catch { ok = false; }
  try { sessionStorage?.clear(); } catch { ok = false; }
  return ok;
}

export function safeSessionGet(key: string): string | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSessionSet(key: string, value: string): boolean {
  try {
    if (typeof sessionStorage === "undefined") return false;
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeSessionRemove(key: string): boolean {
  try {
    if (typeof sessionStorage === "undefined") return false;
    sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

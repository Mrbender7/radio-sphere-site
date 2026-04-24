/**
 * Detection and helpers for in-app browser WebViews
 * (Facebook, Instagram, Line, WeChat, Twitter/X, TikTok, Snapchat, etc.)
 *
 * These environments have severely restricted JavaScript APIs:
 * - localStorage/sessionStorage may be partitioned, throw, or be empty on every load
 * - window.open() is often blocked or opens in the same WebView (no-op)
 * - history.pushState combined with a popstate listener can trap navigation
 * - Service Workers may register but cache corrupted chunks
 * - Some Web APIs (WakeLock, MediaSession, IndexedDB) may throw
 *
 * Always feature-detect AND test storage before relying on browser APIs in these environments.
 */

const IN_APP_BROWSER_REGEX = /FBAN|FBAV|FB_IAB|FB4A|Instagram|Line\/|MicroMessenger|Twitter|TikTok|Snapchat|Pinterest|LinkedInApp|KAKAOTALK/i;

/** Returns true if the current UA looks like a known in-app browser WebView. */
export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return IN_APP_BROWSER_REGEX.test(ua);
}

/** Detect Capacitor native shell (NOT just module presence — actual native bridge). */
export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return typeof cap?.isNativePlatform === "function" && cap.isNativePlatform() === true;
}

/** Detect iOS (any iPhone/iPad/iPod, including in-app WebViews). */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod/i.test(ua);
}

/** Detect Android. */
export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent || "");
}

/** Test whether localStorage is actually usable (not just present). */
export function isLocalStorageWorking(): boolean {
  try {
    const k = "__rs_probe__";
    localStorage.setItem(k, "1");
    const v = localStorage.getItem(k);
    localStorage.removeItem(k);
    return v === "1";
  } catch {
    return false;
  }
}

/**
 * Try multiple strategies to escape an in-app WebView and open the URL externally.
 * Returns true if a strategy was attempted (does NOT guarantee it succeeded —
 * WebViews silently swallow many of these).
 */
export function openInExternalBrowser(url: string): boolean {
  if (typeof window === "undefined") return false;

  // Strategy 1 — Android: Chrome intent URL
  if (isAndroid()) {
    try {
      const cleaned = url.replace(/^https?:\/\//, "");
      const intent = `intent://${cleaned}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = intent;
      return true;
    } catch {
      /* fallthrough */
    }
  }

  // Strategy 2 — iOS: x-safari-https:// scheme
  if (isIOS()) {
    try {
      const safariUrl = url.replace(/^https?:\/\//, "x-safari-https://");
      window.location.href = safariUrl;
      return true;
    } catch {
      /* fallthrough */
    }
  }

  // Strategy 3 — generic window.open (rarely works in WebViews but free to try)
  try {
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (w) return true;
  } catch {
    /* fallthrough */
  }

  // Strategy 4 — last resort: navigate the WebView itself
  try {
    window.location.href = url;
    return true;
  } catch {
    return false;
  }
}

/** Copy text to clipboard with a textarea fallback (Clipboard API often blocked in WebViews). */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Modern API
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallthrough to legacy */
  }
  // Legacy fallback
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

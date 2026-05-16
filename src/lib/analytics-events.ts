/**
 * Umami custom events for hydration & UX diagnostics.
 *
 * All functions are side-effect-safe:
 *  - guarded by `typeof window !== "undefined" && window.umami`
 *  - wrapped in try/catch — never throw, never block render
 *  - payloads kept under ~1 KB (Umami truncates beyond that)
 */

type UmamiWindow = Window & {
  umami?: { track: (name: string, data?: Record<string, unknown>) => void };
};

function trunc(s: unknown, n: number): string {
  if (s == null) return "";
  const str = typeof s === "string" ? s : String(s);
  return str.length > n ? str.slice(0, n) : str;
}

function emit(name: string, data?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    const w = window as UmamiWindow;
    w.umami?.track(name, data);
  } catch {
    /* noop — analytics must never break the app */
  }
}

// ─── 1) hydration-mismatch-detail ────────────────────────────────────────────
export interface HydrationMismatchPayload {
  digest?: string;
  componentStack?: string;
  message: string;
  url?: string;
}
export function trackHydrationMismatch(p: HydrationMismatchPayload): void {
  emit("hydration-mismatch-detail", {
    digest: p.digest ? trunc(p.digest, 80) : "",
    componentStack: trunc(p.componentStack, 500),
    message: trunc(p.message, 200),
    url: p.url ?? (typeof location !== "undefined" ? location.pathname : ""),
  });
}

// ─── 2) csr-fallback-duration ────────────────────────────────────────────────
export function trackCsrFallbackDuration(ms: number): void {
  emit("csr-fallback-duration", { ms: Math.round(ms) });
}

// ─── 3) url-cleaned ──────────────────────────────────────────────────────────
export function trackUrlCleaned(removed: string[]): void {
  if (!removed || removed.length === 0) return;
  emit("url-cleaned", { removed: removed.slice(0, 20).join(",") });
}

// ─── 4) webview-detected ─────────────────────────────────────────────────────
export type WebViewApp =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "snapchat"
  | "linkedin"
  | "other-webview"
  | null;

export function detectWebViewApp(ua: string): WebViewApp {
  if (!ua) return null;
  if (/Instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV/i.test(ua)) return "facebook";
  if (/TikTok|Bytedance/i.test(ua)) return "tiktok";
  if (/Snapchat/i.test(ua)) return "snapchat";
  if (/LinkedInApp/i.test(ua)) return "linkedin";
  if (/\bwv\)|;\s*wv;/i.test(ua)) return "other-webview";
  return null;
}

export function trackWebViewDetected(): void {
  if (typeof navigator === "undefined") return;
  const app = detectWebViewApp(navigator.userAgent || "");
  if (!app) return; // don't pollute Umami with null events
  emit("webview-detected", { app });
}

// ─── 5) pageview-perf ────────────────────────────────────────────────────────
export interface PageviewPerfPayload {
  ttfb: number;
  fcp: number;
  url?: string;
}
export function trackPageviewPerf(p: PageviewPerfPayload): void {
  emit("pageview-perf", {
    ttfb: Math.round(p.ttfb),
    fcp: Math.round(p.fcp),
    url: p.url ?? (typeof location !== "undefined" ? location.pathname : ""),
  });
}

// ─── Helpers (used by main.tsx wiring) ───────────────────────────────────────

/**
 * Strip known tracking query params (fbclid, gclid, utm_*, etc.) from the
 * current URL via history.replaceState. Returns the list of removed keys.
 */
const POLLUTING_PARAMS = [
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "yclid",
  "dclid",
  "twclid",
  "li_fat_id",
  "mc_cid",
  "mc_eid",
  "igshid",
  "ttclid",
  "_openstat",
];
const UTM_PREFIX = /^utm_/i;

export function cleanUrlPollutingParams(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const url = new URL(window.location.href);
    const removed: string[] = [];
    for (const key of Array.from(url.searchParams.keys())) {
      if (POLLUTING_PARAMS.includes(key.toLowerCase()) || UTM_PREFIX.test(key)) {
        url.searchParams.delete(key);
        removed.push(key);
      }
    }
    if (removed.length > 0) {
      const newUrl = url.pathname + (url.search ? url.search : "") + url.hash;
      window.history.replaceState(window.history.state, "", newUrl);
    }
    return removed;
  } catch {
    return [];
  }
}

/**
 * Capture TTFB + FCP for the initial pageview and emit `pageview-perf`.
 * Also re-emits on SPA navigations (history.pushState / popstate).
 */
export function setupPageviewPerf(): void {
  if (typeof window === "undefined") return;

  const emitInitial = () => {
    try {
      const navEntry = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      const ttfb = navEntry ? navEntry.responseStart - navEntry.requestStart : 0;

      const paintEntries = performance.getEntriesByType("paint");
      const fcpEntry = paintEntries.find((e) => e.name === "first-contentful-paint");
      if (fcpEntry) {
        trackPageviewPerf({ ttfb, fcp: fcpEntry.startTime });
        return;
      }
      // FCP not yet available — observe.
      try {
        const obs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === "first-contentful-paint") {
              trackPageviewPerf({ ttfb, fcp: entry.startTime });
              obs.disconnect();
              return;
            }
          }
        });
        obs.observe({ type: "paint", buffered: true });
      } catch {
        /* PerformanceObserver may be unavailable */
      }
    } catch {
      /* noop */
    }
  };

  if (document.readyState === "complete") {
    emitInitial();
  } else {
    window.addEventListener("load", emitInitial, { once: true });
  }

  // SPA navigations — TTFB is N/A, only FCP-equivalent (frame after route change).
  const emitSpa = () => {
    try {
      const t0 = performance.now();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          trackPageviewPerf({ ttfb: 0, fcp: performance.now() - t0 });
        });
      });
    } catch {
      /* noop */
    }
  };

  try {
    const origPush = history.pushState;
    history.pushState = function patchedPushState(...args: Parameters<typeof history.pushState>) {
      const ret = origPush.apply(this, args);
      emitSpa();
      return ret;
    };
    window.addEventListener("popstate", emitSpa);
  } catch {
    /* noop */
  }
}

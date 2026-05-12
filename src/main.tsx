import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./routes";
import { isInAppBrowser } from "./utils/inAppBrowser";
import "./index.css";

export const createRoot = ViteReactSSG({ routes });

const CRASH_FLAG_KEY = "radiosphere_crash_purge_pending";

function isPreviewHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host.endsWith(".lovableproject.com") || host.endsWith(".lovable.app") || host.includes("localhost");
}

async function purgeServiceWorkersAndCaches(reason: string): Promise<void> {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
    }
  } catch {
    /* noop */
  }
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    }
  } catch {
    /* noop */
  }
  console.log(`[RadioSphere] ${reason} — service workers and caches cleared`);
}

/** Detect JSON-parse style crash messages so we can purge the SW cache on next boot. */
function isJsonParseCrash(message: string | undefined | null): boolean {
  if (!message) return false;
  const m = String(message);
  return (
    m.includes("JSON.parse") ||
    m.includes("Unexpected token") ||
    m.includes("Unexpected end of JSON") ||
    m.includes("is not valid JSON")
  );
}

/** Known React hydration / render error codes we want to surface. */
const HYDRATION_REACT_CODES = new Set(["418", "421", "422", "423", "425", "426", "428"]);

/** Extract a React minified error code from a message (e.g. "#418"). */
function extractReactErrorCode(message: string | undefined | null): string | null {
  if (!message) return null;
  const m = /Minified React error #(\d+)/.exec(String(message));
  return m ? m[1] : null;
}

/** Extract the full react.dev/errors URL embedded by React in minified messages. */
function extractReactErrorUrl(message: string | undefined | null): string | null {
  if (!message) return null;
  const m = /https?:\/\/react\.dev\/errors\/[^\s"')]+/.exec(String(message));
  return m ? m[0] : null;
}

/** Detect React hydration mismatch errors (#418, #423, #425, etc.) */
function isHydrationError(message: string | undefined | null): boolean {
  if (!message) return false;
  const m = String(message);
  if (
    m.includes("Hydration failed") ||
    m.includes("hydrating") ||
    m.includes("did not match") ||
    m.includes("Text content does not match")
  ) return true;
  const code = extractReactErrorCode(m);
  return !!code && HYDRATION_REACT_CODES.has(code);
}

/** Truncate while preserving usefulness. */
function trunc(s: string | undefined | null, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) : s;
}

/** Lightweight environment fingerprint (non-personal). */
function envInfo(): Record<string, unknown> {
  try {
    const nav = navigator as Navigator & { connection?: { effectiveType?: string }; deviceMemory?: number };
    return {
      ua: trunc(nav.userAgent, 160),
      lang: nav.language,
      online: nav.onLine,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      dpr: window.devicePixelRatio,
      net: nav.connection?.effectiveType ?? "unknown",
      mem: nav.deviceMemory ?? "unknown",
      visibility: document.visibilityState,
    };
  } catch {
    return {};
  }
}

type UmamiWin = { umami?: { track: (name: string, data?: Record<string, unknown>) => void } };
function umamiTrack(event: string, data?: Record<string, unknown>) {
  try {
    (window as unknown as UmamiWin).umami?.track(event, data);
  } catch { /* noop */ }
}

/** Track crash and report to Umami if available */
function reportCrash(kind: "unhandledrejection" | "error", message: string) {
  try {
    sessionStorage.setItem(CRASH_FLAG_KEY, "1");
  } catch {
    /* noop */
  }
  try {
    const w = window as unknown as { umami?: { track: (name: string, data?: Record<string, unknown>) => void } };
    w.umami?.track("js-crash", {
      kind,
      message: message.slice(0, 200),
      route: window.location.pathname,
    });
  } catch {
    /* noop */
  }
}

if (typeof window !== "undefined") {
  // Catch unhandled promise rejections (e.g. background fetch failures inside
  // in-app browsers like Facebook/Instagram WebViews) to avoid white-screen crashes.
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error ? reason.message : typeof reason === "string" ? reason : String(reason);
    console.warn("[RadioSphere] Unhandled promise rejection:", reason);
    if (isJsonParseCrash(message)) {
      reportCrash("unhandledrejection", message);
    }
    event.preventDefault();
  });

  // Synchronous errors (timers, event handlers) — also flag JSON parse crashes
  // and forward React hydration mismatches (#418/#423/#425) to Umami so we can
  // detect SSR/CSR drift in production.
  window.addEventListener("error", (event) => {
    const message = event.message || (event.error instanceof Error ? event.error.message : "");
    if (isJsonParseCrash(message)) {
      console.warn("[RadioSphere] Sync error (JSON parse):", message);
      reportCrash("error", message);
    }
    if (isHydrationError(message)) {
      console.warn("[RadioSphere] Hydration error detected:", message);
      try {
        const w = window as unknown as { umami?: { track: (name: string, data?: Record<string, unknown>) => void } };
        w.umami?.track("hydration-error", {
          message: message.slice(0, 200),
          route: window.location.pathname,
        });
      } catch { /* noop */ }
    }
  });

  // React 18 reports hydration mismatches via console.error. Wrap it once to
  // forward those to Umami without changing console behaviour.
  const origConsoleError = console.error;
  console.error = function patchedConsoleError(...args: unknown[]) {
    try {
      const msg = args.map((a) => (a instanceof Error ? a.message : typeof a === "string" ? a : "")).join(" ");
      if (isHydrationError(msg)) {
        const w = window as unknown as { umami?: { track: (name: string, data?: Record<string, unknown>) => void } };
        w.umami?.track("hydration-error", {
          message: msg.slice(0, 200),
          route: window.location.pathname,
        });
      }
    } catch { /* noop */ }
    return origConsoleError.apply(console, args as []);
  };

  // PWA install lifecycle — capture the native browser prompt outcome.
  let deferredInstallPrompt: Event | null = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    deferredInstallPrompt = e;
    try {
      const w = window as unknown as { umami?: { track: (name: string, data?: Record<string, unknown>) => void } };
      w.umami?.track("pwa-install-available");
      // Listen for the user's choice on the native prompt.
      const promptEvt = e as Event & { userChoice?: Promise<{ outcome: "accepted" | "dismissed" }> };
      promptEvt.userChoice?.then((choice) => {
        w.umami?.track(
          choice.outcome === "accepted" ? "pwa-install-accepted" : "pwa-install-rejected"
        );
      }).catch(() => { /* noop */ });
    } catch { /* noop */ }
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    try {
      const w = window as unknown as { umami?: { track: (name: string, data?: Record<string, unknown>) => void } };
      w.umami?.track("pwa-installed");
    } catch { /* noop */ }
  });
}

// Register PWA service worker with auto-update (client-side only).
// IMPORTANT: Skip SW registration entirely inside in-app browser WebViews
// (Facebook, Instagram, TikTok…). On those platforms the SW often caches
// corrupted chunks that then break navigation/JSON parsing on next load.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  if (isPreviewHost()) {
    void purgeServiceWorkersAndCaches("Preview environment detected");
  } else if (isInAppBrowser()) {
    console.log("[RadioSphere] In-app WebView detected — skipping SW registration and purging caches");
    // Proactively unregister any previously installed SW and wipe its caches.
    void purgeServiceWorkersAndCaches("In-app WebView detected");
  } else {
    // If the previous session crashed on JSON.parse, purge the api-cache before
    // anything tries to read from it again.
    try {
      if (sessionStorage.getItem(CRASH_FLAG_KEY) === "1" && "caches" in window) {
        sessionStorage.removeItem(CRASH_FLAG_KEY);
        caches
          .delete("api-cache")
          .then((deleted) => {
            console.log(`[RadioSphere] api-cache purge after crash: ${deleted ? "ok" : "no entry"}`);
          })
          .catch(() => {
            /* noop */
          });
      }
    } catch {
      /* sessionStorage may be unavailable in private mode */
    }

    import("virtual:pwa-register").then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onNeedRefresh() {
          if (confirm("Une nouvelle version de RadioSphere.be est disponible. Recharger ?")) {
            window.location.reload();
          }
        },
        onOfflineReady() {
          console.log("[RadioSphere] App prête pour le mode hors ligne");
        },
      });
    }).catch((e) => {
      console.warn("[RadioSphere] PWA register failed:", e);
    });
  }
}

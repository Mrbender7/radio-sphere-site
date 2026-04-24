import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./routes";
import { isInAppBrowser } from "./utils/inAppBrowser";
import "./index.css";

export const createRoot = ViteReactSSG({ routes });

const CRASH_FLAG_KEY = "radiosphere_crash_purge_pending";

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
  window.addEventListener("error", (event) => {
    const message = event.message || (event.error instanceof Error ? event.error.message : "");
    if (isJsonParseCrash(message)) {
      console.warn("[RadioSphere] Sync error (JSON parse):", message);
      reportCrash("error", message);
    }
  });
}

// Register PWA service worker with auto-update (client-side only).
// IMPORTANT: Skip SW registration entirely inside in-app browser WebViews
// (Facebook, Instagram, TikTok…). On those platforms the SW often caches
// corrupted chunks that then break navigation/JSON parsing on next load.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  if (isInAppBrowser()) {
    console.log("[RadioSphere] In-app WebView detected — skipping SW registration and purging caches");
    // Proactively unregister any previously installed SW and wipe its caches.
    try {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister().catch(() => false));
      }).catch(() => {});
    } catch { /* noop */ }
    try {
      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys.forEach((k) => caches.delete(k).catch(() => false));
        }).catch(() => {});
      }
    } catch { /* noop */ }
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

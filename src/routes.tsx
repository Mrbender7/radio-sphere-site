import type { RouteRecord } from "vite-react-ssg";
import App from "./App";
import radioSphereLogo from "@/assets/new-radio-logo.png";

async function clearAllCachesAndReload() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
    }
  } catch {
    /* noop */
  }
  try {
    if (typeof window !== "undefined" && "caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    }
  } catch {
    /* noop */
  }
  window.location.reload();
}

/** Direct visual fallback rendered by react-router when a route throws.
 *  No re-throw — avoids any chance of cycling and guarantees the user
 *  never sees the raw "Unexpected Application Error" screen. */
function RouteErrorFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-8 text-center gap-6">
      <img src={radioSphereLogo} alt="RadioSphere.be" className="w-16 h-16 object-contain rounded-2xl opacity-80" />
      <h1 className="text-xl font-heading font-bold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        An unexpected error occurred. Please reload the page to continue.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity"
        >
          Reload
        </button>
        <button
          onClick={() => { void clearAllCachesAndReload(); }}
          className="px-6 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold border border-border hover:opacity-90 transition-opacity"
        >
          Clear cache & reload
        </button>
      </div>
    </div>
  );
}

export const routes: RouteRecord[] = [
  {
    path: "/",
    Component: App,
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, Component: () => null },
      { path: "search", Component: () => null },
      { path: "library", Component: () => null },
      { path: "settings", Component: () => null },
      { path: "about", Component: () => null },
      { path: "privacy", Component: () => null },
    ],
  },
];

// Routes to pre-render during SSG build
export const includedRoutes = ["/", "/search", "/library", "/settings", "/about", "/privacy"];

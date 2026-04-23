import React from "react";
import radioSphereLogo from "@/assets/new-radio-logo.png";

interface State {
  hasError: boolean;
  error?: Error;
  clearing?: boolean;
}

async function clearAllCachesAndReload() {
  // Service Worker — may be unavailable in Chrome WebView, private mode, or
  // when the page is served over an insecure origin. Each call is guarded.
  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
    }
  } catch {
    /* noop */
  }
  // Cache Storage — not available in older WebView builds.
  try {
    if (typeof window !== "undefined" && "caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    }
  } catch {
    /* noop */
  }
  try {
    sessionStorage.removeItem("radiosphere_crash_purge_pending");
  } catch {
    /* sessionStorage blocked in some WebViews — ignore */
  }
  try {
    window.location.reload();
  } catch {
    /* extremely defensive — should never throw */
  }
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[RadioSphere] ErrorBoundary caught:", error, info.componentStack);

    // Auto-recovery: if this is the first crash this session, the user is likely
    // running a stale cached bundle (e.g. after a deploy). Purge SW + caches and
    // reload once. Subsequent crashes show the manual UI to avoid infinite loops.
    try {
      const AUTO_RECOVERY_KEY = "radiosphere_auto_recovery_attempted";
      const alreadyTried = sessionStorage.getItem(AUTO_RECOVERY_KEY) === "1";
      if (!alreadyTried) {
        sessionStorage.setItem(AUTO_RECOVERY_KEY, "1");
        console.warn("[RadioSphere] Attempting auto-recovery (clear caches + reload)");
        void clearAllCachesAndReload();
      }
    } catch {
      /* sessionStorage unavailable — fall through to manual UI */
    }
  }

  private handleClearCache = async () => {
    this.setState({ clearing: true });
    await clearAllCachesAndReload();
  };

  render() {
    if (this.state.hasError) {
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
              onClick={this.handleClearCache}
              disabled={this.state.clearing}
              className="px-6 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold border border-border hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {this.state.clearing ? "Clearing…" : "Clear cache & reload"}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

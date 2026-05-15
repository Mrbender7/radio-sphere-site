import React from "react";
import radioSphereLogo from "@/assets/new-radio-logo.png";
import {
  isInAppBrowser,
  openInExternalBrowser,
  copyToClipboard,
} from "@/utils/inAppBrowser";
import { safeSessionGet, safeSessionRemove, safeSessionSet } from "@/utils/safeStorage";
import { forceCsrAndReload, setForceCsr } from "@/utils/forceCsr";
import { trackHydrationMismatch } from "@/lib/analytics-events";

interface State {
  hasError: boolean;
  error?: Error;
  clearing?: boolean;
  copied?: boolean;
}

const AUTO_RECOVERY_KEY = "radiosphere_auto_recovery_attempted";

async function hardReload(opts: { purge: boolean }) {
  if (opts.purge) {
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
    safeSessionRemove("radiosphere_crash_purge_pending");
    // Also clear the auto-recovery flags so a future genuine crash can recover.
    try { localStorage.removeItem("radiosphere_auto_recovery_attempted"); } catch { /* noop */ }
    safeSessionRemove("radiosphere_auto_recovery_attempted");
  }
  // Force CSR on next boot so we don't fall right back into the same
  // hydration mismatch that brought the user here.
  setForceCsr();
  // Cache-buster query so Edge / proxies can't return the same stale HTML.
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("_rs", String(Date.now()));
    window.location.replace(url.toString());
  } catch {
    try { window.location.reload(); } catch { /* noop */ }
  }
}

async function clearAllCachesAndReload() {
  await hardReload({ purge: true });
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

    const inApp = isInAppBrowser();

    // Telemetry — single event per crash, no double-fire from auto-recovery.
    try {
      const w = window as unknown as { umami?: { track: (name: string, data?: Record<string, unknown>) => void } };
      w.umami?.track("error-boundary", {
        webview: inApp,
        recovery: inApp ? "auto-webview" : "manual",
        message: String(error?.message || "").slice(0, 200),
      });
    } catch { /* noop */ }

    // Detect React hydration errors (#418/#423/#425…) — these are the ones
    // we know we can recover from by remounting with createRoot (no hydration).
    const msg = String(error?.message || "");
    const hydrationCodeMatch = /Minified React error #(\d+)/.exec(msg);
    const code = hydrationCodeMatch ? hydrationCodeMatch[1] : null;
    const isHydrationCrash = !!code && new Set(["418", "421", "422", "423", "425", "426", "428"]).has(code);

    // Auto-recovery applies to:
    //   - in-app WebViews where hydration genuinely never recovers, OR
    //   - any browser when the error IS a React hydration error.
    // For unrelated component crashes on a normal browser, keep the manual UI.
    if (!inApp && !isHydrationCrash) {
      console.warn("[RadioSphere] Non-hydration crash on regular browser — manual UI");
      return;
    }

    const sessionTried = safeSessionGet(AUTO_RECOVERY_KEY) === "1";
    let localTried = false;
    try { localTried = localStorage.getItem(AUTO_RECOVERY_KEY) === "1"; } catch { /* noop */ }
    if (!sessionTried && !localTried) {
      safeSessionSet(AUTO_RECOVERY_KEY, "1");
      try { localStorage.setItem(AUTO_RECOVERY_KEY, "1"); } catch { /* noop */ }
      setTimeout(() => { try { localStorage.removeItem(AUTO_RECOVERY_KEY); } catch { /* noop */ } }, 60000);
      console.warn("[RadioSphere] WebView crash — attempting auto-recovery (clear caches + reload)");
      void clearAllCachesAndReload();
    } else {
      console.warn("[RadioSphere] WebView auto-recovery already attempted — showing manual UI");
    }
  }

  private handleClearCache = async () => {
    this.setState({ clearing: true });
    await clearAllCachesAndReload();
  };

  private handleOpenExternal = () => {
    const url = "https://radiosphere.be" + (typeof window !== "undefined" ? window.location.pathname : "");
    openInExternalBrowser(url);
  };

  private handleCopy = async () => {
    const url = "https://radiosphere.be" + (typeof window !== "undefined" ? window.location.pathname : "");
    const ok = await copyToClipboard(url);
    if (ok) {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const inApp = isInAppBrowser();

    // In-app browser: friendly bilingual message, no scary "clear cache" wording.
    if (inApp) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center gap-5">
          <img src={radioSphereLogo} alt="RadioSphere.be" className="w-16 h-16 object-contain rounded-2xl opacity-90" />
          <div className="space-y-1.5 max-w-sm">
            <h1 className="text-lg font-heading font-bold">RadioSphere.be</h1>
            <p className="text-sm text-muted-foreground">
              Le navigateur intégré ne supporte pas tout le site. Ouvrez‑le dans votre navigateur habituel pour profiter pleinement de la radio.
            </p>
            <p className="text-xs text-muted-foreground/80">
              This in-app browser is limited. Open the site in your regular browser for the full experience.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
            <button
              onClick={this.handleOpenExternal}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity"
              data-umami-event="error-open-external"
            >
              Ouvrir dans le navigateur
            </button>
            <button
              onClick={this.handleCopy}
              className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold border border-border hover:opacity-90 transition-opacity"
              data-umami-event="error-copy-link"
            >
              {this.state.copied ? "✓ Copié" : "Copier le lien"}
            </button>
          </div>
          <button
            onClick={forceCsrAndReload}
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            Réessayer / Try again
          </button>
        </div>
      );
    }

    // Regular browsers: keep the previous behaviour with the technical button.
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-8 text-center gap-6">
        <img src={radioSphereLogo} alt="RadioSphere.be" className="w-16 h-16 object-contain rounded-2xl opacity-80" />
        <h1 className="text-xl font-heading font-bold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          An unexpected error occurred. Please reload the page to continue.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={this.handleClearCache}
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
}

import React from "react";
import radioSphereLogo from "@/assets/new-radio-logo.png";
import {
  isInAppBrowser,
  openInExternalBrowser,
  copyToClipboard,
} from "@/utils/inAppBrowser";
import { safeSessionGet, safeSessionRemove, safeSessionSet } from "@/utils/safeStorage";

interface State {
  hasError: boolean;
  error?: Error;
  clearing?: boolean;
  copied?: boolean;
}

const AUTO_RECOVERY_KEY = "radiosphere_auto_recovery_attempted";

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
  safeSessionRemove("radiosphere_crash_purge_pending");
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

    // Telemetry
    try {
      const w = window as unknown as { umami?: { track: (name: string, data?: Record<string, unknown>) => void } };
      w.umami?.track("error-boundary", {
        webview: isInAppBrowser(),
        message: String(error?.message || "").slice(0, 200),
      });
    } catch { /* noop */ }

    // Auto-recovery: if this is the first crash this session, the user is likely
    // running a stale cached bundle (e.g. after a deploy). Purge SW + caches and
    // reload once. Subsequent crashes show the manual UI to avoid infinite loops.
    const alreadyTried = safeSessionGet(AUTO_RECOVERY_KEY) === "1";
    if (!alreadyTried) {
      safeSessionSet(AUTO_RECOVERY_KEY, "1");
      console.warn("[RadioSphere] Attempting auto-recovery (clear caches + reload)");
      void clearAllCachesAndReload();
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
            onClick={() => window.location.reload()}
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
}

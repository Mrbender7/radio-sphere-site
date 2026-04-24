import { useEffect, useState } from "react";
import { ExternalLink, X, Copy, AlertTriangle, Check } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { isInAppBrowser, openInExternalBrowser, copyToClipboard } from "@/utils/inAppBrowser";

const STORAGE_KEY = "radiosphere_inapp_banner_dismissed";

/**
 * Warns users browsing inside Facebook / Instagram / TikTok / etc. WebViews
 * that some features may not work and offers escape hatches:
 * - Open in real browser (intent:// on Android, x-safari-https:// on iOS)
 * - Copy URL to paste into a real browser manually
 *
 * The banner can be minimised but never fully auto-hidden, because in many
 * WebViews localStorage is cleared on every load anyway.
 */
export function InAppBrowserBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") {
        setMinimised(true);
      }
    } catch {
      /* localStorage unavailable — show full banner */
    }
    if (isInAppBrowser()) setVisible(true);
  }, []);

  const minimise = () => {
    try { localStorage.setItem(STORAGE_KEY, "true"); } catch {}
    setMinimised(true);
  };

  const expand = () => setMinimised(false);

  const openExternal = () => {
    const url = "https://radiosphere.be" + (typeof window !== "undefined" ? window.location.pathname : "");
    openInExternalBrowser(url);
  };

  const handleCopy = async () => {
    const url = "https://radiosphere.be" + (typeof window !== "undefined" ? window.location.pathname : "");
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!visible) return null;

  // Minimised: small floating chip top-right
  if (minimised) {
    return (
      <button
        onClick={expand}
        aria-label={t("inAppBrowser.warning")}
        className="fixed top-2 right-2 z-[100] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500 text-white shadow-lg text-xs font-semibold hover:opacity-90 transition-opacity"
        style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div
      role="alert"
      className="fixed top-0 inset-x-0 z-[100] bg-amber-500 text-white px-3 py-2.5 shadow-lg"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}
    >
      <div className="flex items-start gap-2 max-w-3xl mx-auto">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm leading-snug font-medium">
            {t("inAppBrowser.warning")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              onClick={openExternal}
              className="inline-flex items-center gap-1 rounded-md bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors px-2.5 py-1.5 text-[11px] font-semibold"
              data-umami-event="inapp-banner-open-external"
            >
              <ExternalLink className="w-3 h-3" />
              <span>{t("inAppBrowser.openExternal")}</span>
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-md bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors px-2.5 py-1.5 text-[11px] font-semibold"
              data-umami-event="inapp-banner-copy-link"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "✓" : t("inAppBrowser.copyLink") || "Copy link"}</span>
            </button>
          </div>
        </div>
        <button
          onClick={minimise}
          className="shrink-0 p-1 rounded-md hover:bg-white/20 transition-colors"
          aria-label={t("aria.close")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

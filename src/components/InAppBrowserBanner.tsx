import { useEffect, useState } from "react";
import { ExternalLink, X, Copy, AlertTriangle, Check, Music } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { isInAppBrowser, openInExternalBrowser, copyToClipboard } from "@/utils/inAppBrowser";

const STORAGE_KEY = "radiosphere_inapp_banner_dismissed";

/**
 * Smart banner for in-app browser WebViews (Facebook, Instagram, TikTok…).
 * Neon-style, highly visible, with a clear CTA to open in an external browser
 * so background audio isn't killed by the WebView.
 */
export function InAppBrowserBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "true" || localStorage.getItem(STORAGE_KEY) === "true") {
        setDismissed(true);
      }
    } catch {
      /* storage unavailable */
    }
    if (isInAppBrowser()) setVisible(true);
  }, []);

  if (!visible || dismissed) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(STORAGE_KEY, "true"); } catch {}
    try { localStorage.setItem(STORAGE_KEY, "true"); } catch {}
    setDismissed(true);
  };

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

  // Translations with fallbacks so the banner works even if i18n keys drift
  const warningText = t("inAppBrowser.warning") || "⚠️ Facebook bloque l'écoute en arrière-plan. Pour ne pas que le son coupe, ouvrez la radio dans votre navigateur.";
  const openLabel = t("inAppBrowser.openExternal") || "Ouvrir dans le navigateur";
  const copyLabel = t("inAppBrowser.copyLink") || "Copier le lien";

  return (
    <div
      role="alert"
      className="fixed top-0 inset-x-0 z-[60] bg-[#070b14] border-b border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.35)]"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.6rem)" }}
    >
      <div className="max-w-3xl mx-auto px-3 pb-3 pt-1">
        <div className="flex items-start gap-3">
          {/* Neon icon pulse */}
          <div className="mt-0.5 shrink-0 relative">
            <AlertTriangle className="w-5 h-5 text-cyan-300" />
            <span className="absolute inset-0 rounded-full animate-ping opacity-30 bg-cyan-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-semibold text-white leading-snug">
              {warningText}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Primary CTA — neon button */}
              <button
                onClick={openExternal}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 text-slate-950 px-4 py-2 text-sm font-bold shadow-[0_0_16px_rgba(34,211,238,0.55)] hover:bg-cyan-300 hover:shadow-[0_0_24px_rgba(34,211,238,0.7)] active:scale-95 transition-all"
                data-umami-event="inapp-banner-open-external"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{openLabel}</span>
              </button>

              {/* Secondary — copy link */}
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 text-cyan-300 px-3 py-2 text-sm font-semibold hover:bg-cyan-400/10 active:scale-95 transition-all"
                data-umami-event="inapp-banner-copy-link"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "✓" : copyLabel}</span>
              </button>

              {/* Hint for manual open */}
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Appuyez sur ⋮ puis « Ouvrir dans… »
              </span>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={dismiss}
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={t("aria.close") || "Fermer"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

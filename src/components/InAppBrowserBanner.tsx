import { useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";

const STORAGE_KEY = "radiosphere_inapp_banner_dismissed";

/**
 * Detects common in-app browser WebViews (Facebook, Instagram, Line, WeChat,
 * Twitter/X, TikTok) which may break external fetches and return HTML
 * interstitials instead of JSON. Suggests opening the site in a real browser.
 */
function detectInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|Instagram|Line\/|MicroMessenger|Twitter|TikTok|FB_IAB/i.test(ua);
}

export function InAppBrowserBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") return;
    } catch {}
    if (detectInAppBrowser()) setVisible(true);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
    setVisible(false);
  };

  const openExternal = () => {
    const url = "https://radiosphere.be" + (typeof window !== "undefined" ? window.location.pathname : "");
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // ignore
    }
  };

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 inset-x-0 z-[100] bg-primary text-primary-foreground px-3 py-2 shadow-lg"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}
    >
      <div className="flex items-center gap-2 max-w-3xl mx-auto">
        <p className="flex-1 text-xs sm:text-sm leading-snug">
          {t("inAppBrowser.warning")}
        </p>
        <button
          onClick={openExternal}
          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-primary-foreground/15 hover:bg-primary-foreground/25 transition-colors px-2.5 py-1.5 text-xs font-semibold"
          data-umami-event="inapp-banner-open-external"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t("inAppBrowser.openExternal")}</span>
        </button>
        <button
          onClick={dismiss}
          className="shrink-0 p-1 rounded-md hover:bg-primary-foreground/15 transition-colors"
          aria-label={t("aria.close")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

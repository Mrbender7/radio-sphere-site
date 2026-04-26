import { useState, useEffect } from "react";
import { Gift, ShieldOff, Clock, X } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { safeGetItem, safeSetItem } from "@/utils/safeStorage";

const STORAGE_KEY = "radiosphere_onboarding_banner_dismissed";

export function OnboardingBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!safeGetItem(STORAGE_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    safeSetItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  const features = [
    { icon: Gift, label: t("onboarding.free"), desc: t("onboarding.freeDesc") },
    { icon: ShieldOff, label: t("onboarding.noAds"), desc: t("onboarding.noAdsDesc") },
    { icon: Clock, label: t("onboarding.tbm"), desc: t("onboarding.tbmDesc") },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-4">
      <div className="relative rounded-2xl border border-primary/20 bg-card/95 backdrop-blur-xl p-5 shadow-2xl shadow-primary/5 overflow-hidden">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-[hsl(280,80%,60%)] to-primary/0" />

        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label={t("aria.close")}
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-sm font-heading font-bold text-foreground mb-3">
          {t("onboarding.title")}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {features.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-start gap-3 p-3 rounded-xl bg-accent/40 hover:bg-accent/70 hover:scale-[1.02] transition-all duration-200 cursor-default"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-[hsl(280,80%,60%)] flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                <Icon className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground leading-tight">{label}</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://play.google.com/store/apps/details?id=com.fhm.radiosphere"
            target="_blank"
            rel="noopener noreferrer"
            data-umami-event="google-play-clicked"
            className="inline-block hover:opacity-90 transition-opacity"
          >
            <img
              src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
              alt="Get it on Google Play"
              className="h-10"
            />
          </a>
          <button
            onClick={dismiss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("onboarding.dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}

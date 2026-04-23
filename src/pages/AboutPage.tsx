import { useTranslation } from "@/contexts/LanguageContext";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import radioSphereLogo from "@/assets/new-radio-logo.png";
import { cn } from "@/lib/utils";
import { Globe, ChevronDown, ExternalLink, ShieldCheck, Rewind, Sparkles, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { AboutFooter } from "@/components/AboutFooter";


function CollapsibleSection({ icon: Icon, title, badge, children }: { icon: React.ElementType; title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full rounded-xl bg-accent p-4 mb-4 text-left transition-all">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2"
        type="button"
      >
        <Icon className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {badge && <span className="ml-auto">{badge}</span>}
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300 ml-auto", open && "rotate-180")} />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          open ? "max-h-[800px] opacity-100 mt-3" : "max-h-0 opacity-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface AboutPageProps {
  onReopenWelcome?: () => void;
  onNavigatePrivacy?: () => void;
  onNavigateSettings?: () => void;
}

export function AboutPage({ onReopenWelcome, onNavigatePrivacy, onNavigateSettings }: AboutPageProps) {
  const { t } = useTranslation();
  const [radioBrowserOpen, setRadioBrowserOpen] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-4">
      <div className="max-w-2xl mx-auto min-h-full flex flex-col">
        <div className="flex items-center gap-3 mt-6 mb-6">
          <img src={radioSphereLogo} alt="RadioSphere.be" className="w-10 h-10 object-contain rounded-xl mix-blend-screen animate-logo-glow" />
          <h1 className="text-2xl lg:text-3xl font-heading font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(280,80%,60%)] bg-clip-text text-transparent drop-shadow-[0_0_12px_hsla(250,80%,60%,0.4)]">{t("nav.about")}</h1>
        </div>

        <OnboardingBanner />

        {/* Mobile-friendly link to Settings */}
        {onNavigateSettings && (
          <button
            onClick={onNavigateSettings}
            className="w-full flex items-center justify-between gap-3 rounded-xl bg-accent hover:bg-accent/70 p-4 mb-4 text-left transition-colors lg:hidden"
          >
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t("nav.settings")}</h3>
                <p className="text-xs text-muted-foreground">{t("settings.language")} · {t("sleepTimer.title")} · {t("favorites.manage")}</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
          </button>
        )}

        {/* TimeBack Machine */}
        <CollapsibleSection icon={Rewind} title="TimeBack Machine">
          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <p>{t("tbmModal.intro")}</p>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">{t("tbmModal.bufferTitle")}</p>
              <p>{t("tbmModal.bufferDesc")}</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">{t("tbmModal.rewindTitle")}</p>
              <p>{t("tbmModal.rewindDesc")}</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">{t("tbmModal.recordTitle")}</p>
              <p>{t("tbmModal.recordDesc")}</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">{t("tbmModal.iconTitle")}</p>
              <p>{t("tbmModal.iconDesc")}</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">{t("tbmModal.liveTitle")}</p>
              <p>{t("tbmModal.liveDesc")}</p>
            </div>
            {/* Mobile quota info */}
            <div className="mt-3 p-3 rounded-lg border border-border bg-accent/30">
              <p className="font-semibold text-foreground text-xs mb-1">📱 {t("tbmQuota.title")}</p>
              <p className="text-xs">{t("tbmQuota.description")}</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Radio Browser */}
        <button
          onClick={() => setRadioBrowserOpen(o => !o)}
          className="w-full rounded-xl border border-border bg-accent/50 p-4 mb-4 text-left transition-all"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-primary shrink-0" />
            <h3 className="text-sm font-semibold text-foreground flex-1">{t("settings.radioSource")}</h3>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", radioBrowserOpen && "rotate-180")} />
          </div>
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              radioBrowserOpen ? "max-h-80 opacity-100 mt-2" : "max-h-0 opacity-0"
            )}
          >
            <p className="text-xs text-muted-foreground leading-relaxed pl-7 mb-3">
              {t("footer.poweredByPrefix")}
              <a
                href="https://www.radio-browser.info/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-primary hover:underline"
              >
                Radio Browser
              </a>
              {t("footer.poweredBySuffix")}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed pl-7 mb-3">{t("settings.radioSourceDesc")}</p>
            <div className="flex flex-col gap-2 pl-7">
              <a href="https://www.radio-browser.info/" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                <ExternalLink className="w-3 h-3" /> {t("settings.radioSourceLink")}
              </a>
              <a href="https://www.radio-browser.info/add" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                <ExternalLink className="w-3 h-3" /> {t("settings.radioSourceAddStation")}
              </a>
            </div>
          </div>
        </button>

        {/* Analytics */}
        <CollapsibleSection icon={ShieldCheck} title={t("settings.analytics") || "Mesure d'audience"}>
          <div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              {t("settings.analyticsDesc") || "RadioSphere.be utilise Umami Analytics, une solution de mesure d'audience respectueuse de la vie privée et conforme au RGPD."}
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("settings.analyticsNoCookies") || "Aucun cookie de suivi"}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("settings.analyticsAnonymous") || "Données entièrement anonymisées"}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("settings.analyticsGDPR") || "Conforme au RGPD européen"}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("settings.analyticsUsage") || "Mesure uniquement l'utilisation globale (pages vues, fonctionnalités utilisées)"}</span>
              </li>
            </ul>
            <div className="mt-3">
              <a
                href="https://umami.is/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                {t("settings.analyticsLearnMore") || "En savoir plus sur Umami"}
              </a>
            </div>
          </div>
        </CollapsibleSection>

        <div className="mt-auto pt-8">
          {/* Privacy Policy link */}
          <button
            onClick={onNavigatePrivacy}
            className="flex items-center justify-center gap-1.5 text-xs text-primary hover:underline mb-3 w-full"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {t("settings.privacyPolicy")}
          </button>

          {/* Reopen welcome */}
          {onReopenWelcome && (
            <button
              onClick={onReopenWelcome}
              className="flex items-center justify-center gap-1.5 text-xs text-primary hover:underline mb-3 w-full"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t("settings.reopenWelcome")}
            </button>
          )}

          {/* Shared footer */}
          <AboutFooter />
        </div>
      </div>
    </div>
  );
}

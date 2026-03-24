import { useState } from "react";
import { Home, Compass, Heart, Info, Mail, ShieldCheck, HelpCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import { LANGUAGE_OPTIONS, type Language } from "@/i18n/translations";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TabId } from "@/components/BottomNav";
import radioSphereLogo from "@/assets/new-radio-logo.png";
import tbmLogo from "@/assets/tbm-logo.png";
import podcastLogo from "@/assets/podcastsphere-logo.png";

const navItems = [
  { id: "home" as TabId, labelKey: "nav.home", icon: Home },
  { id: "search" as TabId, labelKey: "nav.explore", icon: Compass },
  { id: "library" as TabId, labelKey: "nav.favorites", icon: Heart },
  { id: "about" as TabId, labelKey: "nav.about", icon: Info },
];

interface DesktopSidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function DesktopSidebar({ activeTab, onTabChange }: DesktopSidebarProps) {
  const { t, language, setLanguage } = useTranslation();
  const [tbmModalOpen, setTbmModalOpen] = useState(false);

  const tbmSections = [
    { titleKey: "tbmModal.bufferTitle", descKey: "tbmModal.bufferDesc" },
    { titleKey: "tbmModal.rewindTitle", descKey: "tbmModal.rewindDesc" },
    { titleKey: "tbmModal.recordTitle", descKey: "tbmModal.recordDesc" },
    { titleKey: "tbmModal.iconTitle", descKey: "tbmModal.iconDesc" },
    { titleKey: "tbmModal.liveTitle", descKey: "tbmModal.liveDesc" },
  ];

  return (
    <>
    <aside role="navigation" aria-label={t("nav.home")} className="hidden lg:flex flex-col w-72 h-full bg-sidebar border-r border-sidebar-border flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <img
          src={radioSphereLogo}
          alt="RadioSphere.be"
          className="w-11 h-11 rounded-xl mix-blend-screen animate-logo-glow"
        />
        <h1 className="text-xl font-heading font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(280,80%,60%)] bg-clip-text text-transparent">
          RadioSphere.be
        </h1>
      </div>

      {/* Description + TBM teaser */}
      <div className="px-5 pb-4 space-y-2">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {t("sidebar.stationCount")}
        </p>
        <div className="rounded-lg bg-accent/60 p-2.5 space-y-1.5">
          <div className="flex items-center gap-2">
            <img src={tbmLogo} alt="TimeBack Machine" className="w-5 h-5 rounded" />
            <span className="text-[11px] font-semibold text-foreground">TimeBack Machine</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {t("sidebar.tbmTeaser")}
          </p>
          <button
            onClick={() => setTbmModalOpen(true)}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
          >
            <HelpCircle className="w-3 h-3" />
            {t("sidebar.tbmHowItWorks")}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-1">
        {navItems.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              activeTab === id
                ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.3)] shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <Icon className="w-5 h-5" />
            {t(labelKey)}
          </button>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Contact, Language & Copyright */}
      <div className="px-4 pb-6 pt-4 space-y-3">
        {/* PodcastSphere promo */}
        <a
          href="https://podcast.radiosphere.be/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-accent/60 hover:bg-accent transition-colors group"
        >
          <img src={podcastLogo} alt="PodcastSphere" className="w-9 h-9 rounded-lg" loading="lazy" width={36} height={36} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-heading font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(280,80%,60%)] bg-clip-text text-transparent">PodcastSphere</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </div>
            <span className="text-[10px] text-muted-foreground leading-tight block">podcast.radiosphere.be</span>
            <span className="text-[10px] text-muted-foreground/70 italic leading-tight block">{t("sidebar.podcastTeaser")}</span>
          </div>
        </a>

        <a
          href="mailto:info@radiosphere.be"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-muted-foreground hover:text-primary hover:bg-sidebar-accent transition-colors"
        >
          <Mail className="w-4 h-4" />
          info@radiosphere.be
        </a>
        <a
          href="https://radiosphere.be/privacy-policy.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-primary hover:bg-sidebar-accent transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {t("settings.privacyPolicy")}
        </a>
        <div className="flex items-center gap-2 px-4">
          {LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLanguage(opt.value)}
              className={cn(
                "transition-all rounded-full overflow-hidden",
                language === opt.value
                  ? "ring-2 ring-primary scale-110"
                  : "opacity-50 hover:opacity-100 hover:scale-105 grayscale hover:grayscale-0"
              )}
              title={opt.label}
            >
              <img src={opt.flagUrl} alt={opt.label} className="w-6 h-6 object-cover rounded-full" />
            </button>
          ))}
        </div>
        <p className="px-4 text-[10px] text-muted-foreground leading-relaxed">
          © {new Date().getFullYear()} RadioSphere.be — {t("footer.createdBy")}
        </p>
        <p className="px-4 text-[10px] text-muted-foreground leading-relaxed">
          {t("footer.poweredByPrefix")}
          <a href="https://www.radio-browser.info/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Radio Browser</a>{t("footer.poweredBySuffix")}
        </p>
      </div>
    </aside>

    {/* TBM Modal */}
    <Dialog open={tbmModalOpen} onOpenChange={setTbmModalOpen}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto rounded-2xl bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(280,80%,60%)] bg-clip-text text-transparent flex items-center gap-2">
            <img src={tbmLogo} alt="TBM" className="w-6 h-6 rounded" />
            {t("tbmModal.title")}
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("tbmModal.intro")}
        </p>
        <div className="space-y-4 mt-2">
          {tbmSections.map(({ titleKey, descKey }) => (
            <div key={titleKey} className="rounded-xl bg-accent p-3.5">
              <h4 className="text-sm font-semibold text-foreground mb-1">{t(titleKey)}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{t(descKey)}</p>
            </div>
          ))}
        </div>
        <DialogClose asChild>
          <Button size="sm" className="w-full mt-2 text-xs">{t("tbmModal.close")}</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
    </>
  );
}

import { useTranslation } from "@/contexts/LanguageContext";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { useSleepTimer, SLEEP_TIMER_OPTIONS } from "@/contexts/SleepTimerContext";
import { useFavoritesContext } from "@/contexts/FavoritesContext";
import radioSphereLogo from "@/assets/new-radio-logo.png";
import { cn } from "@/lib/utils";
import { Wifi, Moon, Globe, ChevronDown, TimerOff, Heart, Download, Upload, ExternalLink, ShieldCheck, RotateCcw, Sparkles, Trash2, RefreshCw } from "lucide-react";
import { LANGUAGE_OPTIONS } from "@/i18n/translations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { UserGuideModal } from "@/components/UserGuideModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useCallback } from "react";
import { searchStationByUrl } from "@/services/RadioService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { RadioStation } from "@/types/radio";


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
  onResetApp?: () => void;
  onNavigatePrivacy?: () => void;
}

export function AboutPage({ onReopenWelcome, onResetApp, onNavigatePrivacy }: AboutPageProps) {
  const { language, setLanguage, t } = useTranslation();
  const { isActive, formattedTime, startTimer, cancelTimer } = useSleepTimer();
  const { favorites, importFavorites } = useFavoritesContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [radioBrowserOpen, setRadioBrowserOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [unavailableStations, setUnavailableStations] = useState<RadioStation[]>([]);
  const [showUnavailableDialog, setShowUnavailableDialog] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mt-6 mb-6">
          <img src={radioSphereLogo} alt="RadioSphere.be" className="w-10 h-10 rounded-xl mix-blend-screen animate-logo-glow" />
          <h1 className="text-2xl lg:text-3xl font-heading font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(280,80%,60%)] bg-clip-text text-transparent drop-shadow-[0_0_12px_hsla(250,80%,60%,0.4)]">{t("nav.about")}</h1>
        </div>

        <OnboardingBanner />

        {/* Language */}
        <div className="rounded-xl bg-accent p-4 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-1">{t("settings.language")}</h3>
          <p className="text-xs text-muted-foreground mb-3">{t("settings.languageDesc")}</p>
          <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
            <SelectTrigger className="w-full rounded-lg bg-secondary text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="inline-flex items-center gap-2"><img src={opt.flagUrl} alt={opt.label} className="w-5 h-4 object-cover rounded-sm" /> {opt.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sleep Timer */}
        <CollapsibleSection
          icon={Moon}
          title={t("sleepTimer.title")}
          badge={
            isActive ? (
              <span className="inline-flex items-center gap-1 bg-primary/20 text-primary rounded-full px-2.5 py-0.5 text-[10px] font-semibold font-mono">
                ⏱ {formattedTime}
              </span>
            ) : null
          }
        >
          <div>
            <p className="text-xs text-muted-foreground mb-3">{t("sleepTimer.desc")}</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {SLEEP_TIMER_OPTIONS.map(opt => (
                <button
                  key={opt.minutes}
                  onClick={(e) => { e.stopPropagation(); startTimer(opt.minutes); }}
                  className={cn(
                    "py-2.5 rounded-lg text-xs font-semibold transition-all",
                    "bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  {t(`sleepTimer.${opt.minutes}`)}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-3">
              <Input
                type="number"
                min="1"
                max="999"
                placeholder={t("sleepTimer.customPlaceholder")}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 h-9 text-xs bg-secondary border-border"
              />
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  const mins = parseInt(customMinutes);
                  if (mins > 0) {
                    startTimer(mins);
                    setCustomMinutes("");
                  }
                }}
                size="sm"
                className="h-9 px-4 text-xs font-semibold"
                disabled={!customMinutes || parseInt(customMinutes) <= 0}
              >
                {t("sleepTimer.customGo")}
              </Button>
            </div>
            {isActive && (
              <Button
                onClick={(e) => { e.stopPropagation(); cancelTimer(); }}
                variant="outline"
                size="sm"
                className="w-full rounded-lg border-destructive/30 text-destructive text-xs gap-1.5"
              >
                <TimerOff className="w-3.5 h-3.5" />
                {t("sleepTimer.cancel")}
              </Button>
            )}
          </div>
        </CollapsibleSection>

        {/* TimeBack Machine */}
        <CollapsibleSection icon={RotateCcw} title="TimeBack Machine">
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

        {/* Favorites management */}
        <CollapsibleSection icon={Heart} title={t("favorites.manage")}>
          <div className="space-y-2">
            <Button
              onClick={async () => {
                if (favorites.length === 0) {
                  toast({ title: t("favorites.noFavoritesToExport") });
                  return;
                }
                const header = "name,streamUrl,country,tags,homepage";
                const rows = favorites.map(s =>
                  [s.name, s.streamUrl, s.country, s.tags.join(";"), s.homepage]
                    .map(v => `"${(v || "").replace(/"/g, '""')}"`)
                    .join(",")
                );
                const csv = [header, ...rows].join("\n");
                if (Capacitor.isNativePlatform()) {
                  try {
                    const result = await Filesystem.writeFile({
                      path: "radiosphere_favorites.csv",
                      data: btoa(unescape(encodeURIComponent(csv))),
                      directory: Directory.Cache,
                    });
                    await Share.share({ title: "RadioSphere.be Favorites", url: result.uri });
                  } catch {
                    toast({ title: `❌ ${t("favorites.importError")}`, variant: "destructive" });
                  }
                } else {
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "radiosphere_favorites.csv";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                  toast({ title: `✅ ${t("favorites.exported")}` });
                }
              }}
              variant="outline"
              size="sm"
              className="w-full rounded-lg text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {t("favorites.export")}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const text = ev.target?.result as string;
                    const lines = text.split("\n").filter(l => l.trim());
                    const dataLines = lines.slice(1);
                    const stations: RadioStation[] = dataLines.map((line, i) => {
                      const cols: string[] = [];
                      let current = "";
                      let inQuotes = false;
                      for (let j = 0; j < line.length; j++) {
                        const ch = line[j];
                        if (inQuotes) {
                          if (ch === '"' && line[j + 1] === '"') { current += '"'; j++; }
                          else if (ch === '"') { inQuotes = false; }
                          else { current += ch; }
                        } else {
                          if (ch === '"') { inQuotes = true; }
                          else if (ch === ',') { cols.push(current); current = ""; }
                          else { current += ch; }
                        }
                      }
                      cols.push(current);
                      return {
                        id: `import-${Date.now()}-${i}`,
                        name: cols[0] || "Unknown",
                        streamUrl: cols[1] || "",
                        country: cols[2] || "",
                        countryCode: "",
                        tags: cols[3] ? cols[3].split(";").filter(Boolean) : [],
                        language: "",
                        codec: "",
                        bitrate: 0,
                        votes: 0,
                        clickcount: 0,
                        logo: "",
                        homepage: cols[4] || "",
                      };
                    }).filter(s => s.streamUrl);
                    const count = importFavorites(stations);
                    toast({ title: `✅ ${count} ${t("favorites.imported")}` });
                    if (count > 0) {
                      toast({ title: `🔄 ${t("favorites.refreshingMetadata")}` });
                      (async () => {
                        const notFound: RadioStation[] = [];
                        for (const station of stations) {
                          try {
                            const found = await searchStationByUrl(station.streamUrl);
                            if (found) {
                              importFavorites([{ ...found, id: found.id }]);
                            } else {
                              notFound.push(station);
                            }
                          } catch {
                            notFound.push(station);
                          }
                        }
                        toast({ title: `✅ ${t("favorites.metadataRefreshed")}` });
                        if (notFound.length > 0) {
                          setUnavailableStations(notFound);
                          setShowUnavailableDialog(true);
                        }
                      })();
                    }
                  } catch {
                    toast({ title: `❌ ${t("favorites.importError")}`, variant: "destructive" });
                  }
                };
                reader.readAsText(file);
                e.target.value = "";
              }}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="w-full rounded-lg text-xs gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              {t("favorites.import")}
            </Button>
            <Button
              onClick={async () => {
                if (favorites.length === 0) {
                  toast({ title: t("favorites.noFavoritesToExport") });
                  return;
                }
                toast({ title: `🔄 ${t("favorites.refreshingMetadata")}` });
                const notFound: RadioStation[] = [];
                for (const station of favorites) {
                  try {
                    const found = await searchStationByUrl(station.streamUrl);
                    if (found) {
                      importFavorites([{ ...found, id: found.id }]);
                    } else {
                      notFound.push(station);
                    }
                  } catch {
                    notFound.push(station);
                  }
                }
                toast({ title: `✅ ${t("favorites.metadataRefreshed")}` });
                if (notFound.length > 0) {
                  setUnavailableStations(notFound);
                  setShowUnavailableDialog(true);
                }
              }}
              variant="outline"
              size="sm"
              className="w-full rounded-lg text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t("favorites.refreshMetadata")}
            </Button>
          </div>
        </CollapsibleSection>

        {/* User Guide */}
        <UserGuideModal onReopenWelcome={onReopenWelcome} />

        {/* Radio Browser */}
        <button
          onClick={() => setRadioBrowserOpen(o => !o)}
          className="w-full rounded-xl border border-border bg-accent/50 p-4 mb-4 text-left transition-all"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
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

        {/* Reset app */}
        {onResetApp && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex items-center justify-center gap-1.5 text-xs text-destructive hover:underline mb-4 w-full">
                <Trash2 className="w-3.5 h-3.5" />
                {t("settings.resetApp")}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("settings.resetApp")}</AlertDialogTitle>
                <AlertDialogDescription>{t("settings.resetConfirm")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={onResetApp} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {t("settings.resetButton")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Copyright */}
        <div className="text-center mb-6 select-none space-y-1">
          <p className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} RadioSphere.be — {t("footer.createdBy").split("Franck Malherbe")[0]}<a href="https://franckmalherbe.be" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Franck Malherbe</a>{t("footer.createdBy").split("Franck Malherbe")[1]}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {t("footer.poweredByPrefix")}
            <a
              href="https://www.radio-browser.info/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Radio Browser
            </a>
            {t("footer.poweredBySuffix")}
          </p>
        </div>

        {/* Social links */}
        <div className="flex items-center justify-center gap-4 pt-2 pb-4">
          <a
            href="https://www.facebook.com/profile.php?id=61575475057830"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
            aria-label="Facebook"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a
            href="https://www.instagram.com/radiosphere.be/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
            aria-label="Instagram"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a
            href="https://bsky.app/profile/radiospherebe.bsky.social"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
            aria-label="Bluesky"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.673 3.563 6.691 3.21-4.476.726-8.056 2.525-4.174 7.07C6.72 24.438 10.16 21.086 12 18c1.84 3.086 5.147 6.376 8.859 2.527 3.882-4.545.302-6.344-4.174-7.07 3.018.353 5.906-.583 6.691-3.21.246-.828.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.3-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"/></svg>
          </a>
        </div>

        {/* Unavailable stations dialog */}
        <Dialog open={showUnavailableDialog} onOpenChange={setShowUnavailableDialog}>
          <DialogContent className="max-w-sm rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-sm">{t("favorites.unavailableStations")}</DialogTitle>
              <DialogDescription className="text-xs">{t("favorites.unavailableDesc")}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-60">
              <div className="space-y-2">
                {unavailableStations.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                    <Wifi className="w-3.5 h-3.5 text-destructive shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{s.streamUrl}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button size="sm" className="w-full text-xs">{t("favorites.understood")}</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

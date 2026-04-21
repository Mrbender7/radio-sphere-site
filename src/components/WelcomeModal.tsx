import { useState, useEffect } from "react";
import radioSphereLogo from "@/assets/new-radio-logo.png";
import { Globe, Radio, Heart, Search, Music, ChevronRight, ShieldCheck } from "lucide-react";
import type { Language } from "@/i18n/translations";
import { detectInitialLanguage } from "@/contexts/LanguageContext";
import { LANGUAGE_OPTIONS } from "@/i18n/translations";
import translations from "@/i18n/translations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (lang: Language) => void;
}

const FEATURE_ICONS = [Radio, Search, Heart, Music] as const;
const FEATURE_KEYS = ["welcome.stations", "welcome.search", "welcome.favExport", "welcome.genres"] as const;

export function WelcomeModal({ open, onOpenChange, onComplete }: WelcomeModalProps) {
  const [selectedLang, setSelectedLang] = useState<Language>(detectInitialLanguage);
  const t = (key: string) => translations[selectedLang][key] ?? key;

  // Apply RTL direction immediately when Arabic is selected in the modal
  useEffect(() => {
    if (!open) return;
    try {
      document.documentElement.lang = selectedLang;
      document.documentElement.dir = selectedLang === "ar" ? "rtl" : "ltr";
    } catch {}
  }, [selectedLang, open]);

  const handleContinue = () => {
    onComplete(selectedLang);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
        <VisuallyHidden>
          <DialogTitle>RadioSphere.be — {t("welcome.subtitle")}</DialogTitle>
          <DialogDescription>{t("welcome.subtitle")}</DialogDescription>
        </VisuallyHidden>

        <div className="flex flex-col items-center text-center">
          {/* Logo */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-primary/60 blur-3xl scale-[2.2] animate-pulse" />
            <div className="absolute inset-0 rounded-full bg-[hsl(280,80%,60%)]/40 blur-2xl scale-[1.8] animate-pulse" />
            <img
              src={radioSphereLogo}
              alt="RadioSphere.be"
              className="w-24 h-24 rounded-2xl relative z-10 mix-blend-screen animate-logo-glow"
            />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] bg-clip-text text-transparent mb-2 drop-shadow-[0_0_16px_hsla(250,80%,60%,0.4)]">
            RadioSphere.be
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            {t("welcome.subtitle")}
          </p>

          {/* Google Play badge — prominent */}
          <a
            href="https://play.google.com/store/apps/details?id=com.fhm.radiosphere"
            target="_blank"
            rel="noopener noreferrer"
            data-umami-event="google-play-welcome"
            className="block hover:opacity-90 transition-opacity mb-6"
          >
            <img
              src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
              alt="Get it on Google Play"
              className="h-[4.5rem] mx-auto drop-shadow-lg"
            />
          </a>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-8">
            {FEATURE_KEYS.map((key, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <div
                  key={key}
                  className="flex items-center gap-2.5 rounded-xl bg-accent/80 border border-border/50 p-3"
                >
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-medium text-foreground text-left leading-tight">
                    {t(key)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Language selector — dropdown */}
          <div className="w-full max-w-xs mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                {t("welcome.chooseLanguage")}
              </p>
            </div>
            <Select value={selectedLang} onValueChange={(v) => setSelectedLang(v as Language)}>
              <SelectTrigger className="w-full rounded-xl bg-secondary text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="inline-flex items-center gap-2">
                      <img src={opt.flagUrl} alt={opt.label} className="w-5 h-4 object-cover rounded-sm" />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Continue button */}
          <button
            onClick={handleContinue}
            className="w-full max-w-xs py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-[hsl(220,90%,56%)] to-[hsl(280,80%,56%)] text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {t("welcome.start")}
            <ChevronRight className="w-4 h-4 rtl-flip" />
          </button>

          {/* Social links */}
          <div className="flex items-center gap-5 mt-5 mb-2">
            <a href="https://www.facebook.com/profile.php?id=61575475057830" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" title="Facebook">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://www.instagram.com/radiosphere.be/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" title="Instagram">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C16.67.014 16.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="https://bsky.app/profile/radiospherebe.bsky.social" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" title="Bluesky">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.603 3.496 6.159 3.18-4.397.645-7.945 2.267-4.453 7.803C4.6 24.457 9.456 20.78 12 17.036c2.544 3.744 7.063 7.088 9.67 4.194 3.492-5.536-.056-7.158-4.453-7.803 2.556.316 5.374-.553 6.159-3.18.246-.828.624-5.788.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.3-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"/></svg>
            </a>
          </div>

          <a
            href="https://radiosphere.be/privacy-policy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:underline mt-2"
          >
            <ShieldCheck className="w-3 h-3" />
            {t("settings.privacyPolicy")}
          </a>

          <p className="text-[10px] text-muted-foreground mt-3 opacity-60">radiosphere.be</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

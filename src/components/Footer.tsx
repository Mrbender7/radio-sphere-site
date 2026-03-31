import { useTranslation } from "@/contexts/LanguageContext";
import { ShieldCheck, Mail, ExternalLink } from "lucide-react";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="hidden lg:flex items-center justify-between gap-4 px-6 py-2 border-t border-border bg-secondary/30 backdrop-blur-sm text-[10px] text-muted-foreground">
      <span>© {new Date().getFullYear()} RadioSphere.be — {t("footer.createdBy").split("Franck Malherbe")[0]}<a href="https://franckmalherbe.be" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Franck Malherbe</a>{t("footer.createdBy").split("Franck Malherbe")[1]}</span>
      <div className="flex items-center gap-4">
        <a href="https://radiosphere.be/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
          <ShieldCheck className="w-3 h-3" />
          {t("settings.privacyPolicy")}
        </a>
        <a href="https://www.radio-browser.info/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
          <ExternalLink className="w-3 h-3" />
          Radio Browser
        </a>
        <a href="mailto:info@radiosphere.be" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
          <Mail className="w-3 h-3" />
          info@radiosphere.be
        </a>
      </div>
      <span>radiosphere.be</span>
    </footer>
  );
}

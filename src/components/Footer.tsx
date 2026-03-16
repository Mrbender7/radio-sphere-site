import { useTranslation } from "@/contexts/LanguageContext";
import { ShieldCheck, Mail, ExternalLink } from "lucide-react";
import radioSphereLogo from "@/assets/new-radio-logo.png";

interface FooterProps {
  // onNavigatePrivacy removed - now uses external link
}

export function Footer(_props: FooterProps) {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-secondary/30 backdrop-blur-sm mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <img src={radioSphereLogo} alt="Radio Sphere" className="w-8 h-8 rounded-lg" />
              <span className="font-heading font-bold text-foreground">Radio Sphere</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("footer.links")}</h4>
            <a
              href="https://radiosphere.be/privacy-policy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-foreground/70 hover:text-primary transition-colors w-fit"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {t("settings.privacyPolicy")}
            </a>
            <a
              href="https://www.radio-browser.info/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-foreground/70 hover:text-primary transition-colors w-fit"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Radio Browser API
            </a>
          </div>

          {/* Attribution */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
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

          {/* Contact */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("footer.contact")}</h4>
            <a
              href="mailto:info@radiosphere.be"
              className="inline-flex items-center gap-1.5 text-xs text-foreground/70 hover:text-primary transition-colors w-fit"
            >
              <Mail className="w-3.5 h-3.5" />
              info@radiosphere.be
            </a>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-border/50 flex flex-col items-center gap-1">
          <p className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} Radio Sphere — {t("footer.createdBy")}. {t("footer.rights")}
          </p>
          <p className="text-[10px] text-muted-foreground">
            radiosphere.be
          </p>
        </div>
      </div>
    </footer>
  );
}

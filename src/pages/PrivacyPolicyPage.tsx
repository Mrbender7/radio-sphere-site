import { useTranslation } from "@/contexts/LanguageContext";
import { ShieldCheck, ArrowLeft, Mail } from "lucide-react";
import radioSphereLogo from "@/assets/new-radio-logo.png";

interface PrivacyPolicyPageProps {
  onBack?: () => void;
}

export function PrivacyPolicyPage({ onBack }: PrivacyPolicyPageProps) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mt-6 mb-8">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl lg:text-3xl font-heading font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(280,80%,60%)] bg-clip-text text-transparent">
            {t("privacy.title")}
          </h1>
        </div>

        <div className="space-y-8 text-sm text-foreground/90 leading-relaxed">
          {/* Intro */}
          <section className="rounded-xl bg-accent/50 border border-border p-6">
            <div className="flex items-center gap-3 mb-3">
              <img src={radioSphereLogo} alt="Radio Sphere" className="w-8 h-8 rounded-lg" />
              <p className="font-semibold text-foreground">Radio Sphere — radiosphere.be</p>
            </div>
            <p className="text-xs text-muted-foreground">{t("privacy.lastUpdated")}: 13 mars 2026</p>
          </section>

          <section>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3">{t("privacy.dataCollection")}</h2>
            <p className="text-muted-foreground">{t("privacy.dataCollectionDesc")}</p>
          </section>

          <section>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3">{t("privacy.localStorage")}</h2>
            <p className="text-muted-foreground">{t("privacy.localStorageDesc")}</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground text-xs">
              <li>{t("privacy.localStorageFavorites")}</li>
              <li>{t("privacy.localStorageLang")}</li>
              <li>{t("privacy.localStorageRecent")}</li>
              <li>{t("privacy.localStoragePrefs")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3">{t("privacy.thirdParty")}</h2>
            <p className="text-muted-foreground">{t("privacy.thirdPartyDesc")}</p>
          </section>

          <section>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3">{t("privacy.permissions")}</h2>
            <p className="text-muted-foreground">{t("privacy.permissionsDesc")}</p>
          </section>

          <section>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3">{t("privacy.security")}</h2>
            <p className="text-muted-foreground">{t("privacy.securityDesc")}</p>
          </section>

          <section>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3">{t("privacy.contact")}</h2>
            <p className="text-muted-foreground mb-3">{t("privacy.contactDesc")}</p>
            <a
              href="mailto:info@radiosphere.be"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <Mail className="w-4 h-4" />
              info@radiosphere.be
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}

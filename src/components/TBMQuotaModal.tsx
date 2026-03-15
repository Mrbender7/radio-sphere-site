import { useTranslation } from "@/contexts/LanguageContext";
import { Clock, Download, Radio } from "lucide-react";

interface TBMQuotaModalProps {
  open: boolean;
  onClose: () => void;
  onReturnToLive: () => void;
}

export function TBMQuotaModal({ open, onClose, onReturnToLive }: TBMQuotaModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/50 p-6 space-y-5 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Icon */}
        <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(35,80%,55%)] to-[hsl(25,70%,40%)] flex items-center justify-center shadow-lg shadow-[hsl(35,80%,55%)]/20">
          <Clock className="w-7 h-7 text-white" />
        </div>

        {/* Title */}
        <h2 className="text-center text-lg font-bold text-foreground leading-tight">
          {t("tbmQuota.title")}
        </h2>

        {/* Description */}
        <p className="text-center text-sm text-muted-foreground leading-relaxed">
          {t("tbmQuota.description")}
        </p>

        {/* CTA Button */}
        <a
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all bg-gradient-to-r from-[hsl(35,80%,50%)] to-[hsl(25,70%,45%)] text-white shadow-lg shadow-[hsl(35,80%,50%)]/30 hover:shadow-[hsl(35,80%,50%)]/50 active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          {t("tbmQuota.cta")}
        </a>

        {/* Continue Live */}
        <button
          onClick={onReturnToLive}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-all border border-border/50 bg-accent/30 text-muted-foreground hover:text-foreground hover:bg-accent/50 active:scale-[0.98]"
        >
          <Radio className="w-4 h-4" />
          {t("tbmQuota.continueLive")}
        </button>
      </div>
    </div>
  );
}

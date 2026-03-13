import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";

interface SSLWarningDialogProps {
  open: boolean;
  stationName: string;
  onAcceptRisk: () => void;
  onCancel: () => void;
}

export const SSLWarningDialog = React.forwardRef<HTMLDivElement, SSLWarningDialogProps>(function SSLWarningDialog({ open, stationName, onAcceptRisk, onCancel }, _ref) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-base">
              {t("ssl.title")}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm leading-relaxed space-y-2">
            <p>
              <span className="font-medium text-foreground">{stationName}</span>{" "}
              {t("ssl.description")}
            </p>
            <p className="text-muted-foreground text-xs">
              {t("ssl.technical")}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel onClick={onCancel}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onAcceptRisk}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("ssl.acceptRisk")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

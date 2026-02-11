import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTranslation } from "@/contexts/LanguageContext";

interface ExitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExitConfirmDialog({ open, onOpenChange }: ExitConfirmDialogProps) {
  const { t } = useTranslation();

  const handleExit = () => {
    // Attempt to close the app or navigate away
    if (window.history.length <= 1) {
      // No history, try to close
      window.close();
    } else {
      // Go back
      window.history.back();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("exit.title") || "Fermer l'application?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("exit.description") || "Appuyez une fois de plus pour quitter RadioSphere."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3">
          <AlertDialogCancel>{t("common.cancel") || "Annuler"}</AlertDialogCancel>
          <AlertDialogAction onClick={handleExit}>{t("exit.confirm") || "Quitter"}</AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

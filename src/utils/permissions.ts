import { toast } from "@/hooks/use-toast";

/**
 * Re-requests app permissions (notifications only).
 * Storage permission is NOT needed — recordings use Cache + Share sheet.
 * Location is handled by Cast plugin natively.
 */
export async function requestAllPermissions() {
  let granted = 0;
  let total = 0;

  // Notifications
  try {
    total++;
    if (window.hasOwnProperty("Capacitor")) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const result = await LocalNotifications.requestPermissions();
      if (result.display === "granted") granted++;
    } else if ("Notification" in window) {
      const result = await Notification.requestPermission();
      if (result === "granted") granted++;
    } else {
      granted++; // No notification API available
    }
  } catch {
    console.log("[Permissions] Notification permission request failed");
  }

  // Storage permission removed — Cache + Share flow doesn't need it

  try {
    toast({
      title: `${granted}/${total}`,
      description: granted === total
        ? "✅ All permissions granted"
        : "⚠️ Some permissions were denied. You can enable them in your device settings.",
    });
  } catch {}
}

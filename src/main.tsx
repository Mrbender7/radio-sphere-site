import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./routes";
import "./index.css";

export const createRoot = ViteReactSSG({ routes });

// Catch unhandled promise rejections (e.g. background fetch failures inside
// in-app browsers like Facebook/Instagram WebViews) to avoid white-screen crashes.
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    console.warn("[RadioSphere] Unhandled promise rejection:", event.reason);
    event.preventDefault();
  });
}

// Register PWA service worker with auto-update (client-side only)
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        if (confirm("Une nouvelle version de RadioSphere.be est disponible. Recharger ?")) {
          window.location.reload();
        }
      },
      onOfflineReady() {
        console.log("[RadioSphere] App prête pour le mode hors ligne");
      },
    });
  });
}

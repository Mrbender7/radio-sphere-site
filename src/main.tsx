import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./routes";
import "./index.css";

export const createRoot = ViteReactSSG({ routes });

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

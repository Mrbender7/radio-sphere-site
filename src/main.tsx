import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register PWA service worker with auto-update
if ("serviceWorker" in navigator) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        // Auto-reload when a new version is available
        if (confirm("Une nouvelle version de Radio Sphere est disponible. Recharger ?")) {
          window.location.reload();
        }
      },
      onOfflineReady() {
        console.log("[RadioSphere] App prête pour le mode hors ligne");
      },
    });
  });
}

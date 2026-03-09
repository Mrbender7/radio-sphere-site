import stationPlaceholder from "@/assets/station-placeholder.png";
import { RadioStation } from "@/types/radio";

// ── Settings ───────────────────────────────────────────────────────
const SETTINGS_KEY = "radiosphere_replace_low_quality";
const MIN_DIMENSION = 100;

export function getReplaceLowQuality(): boolean {
  try {
    return localStorage.getItem(SETTINGS_KEY) === "true";
  } catch {
    return false;
  }
}

export function setReplaceLowQuality(value: boolean) {
  try {
    localStorage.setItem(SETTINGS_KEY, String(value));
  } catch { /* non-critical */ }
}

// ── Image quality validation ───────────────────────────────────────
function validateImage(url: string): Promise<"OK" | "LOW_QUALITY" | "ERROR"> {
  return new Promise((resolve) => {
    if (!url) { resolve("ERROR"); return; }
    const timeout = setTimeout(() => resolve("ERROR"), 8000);
    const img = new Image();
    img.onload = () => {
      clearTimeout(timeout);
      resolve(
        img.naturalWidth < MIN_DIMENSION || img.naturalHeight < MIN_DIMENSION
          ? "LOW_QUALITY"
          : "OK"
      );
    };
    img.onerror = () => { clearTimeout(timeout); resolve("ERROR"); };
    img.src = url;
  });
}

// ── Manual scan: only favorites, only on toggle ────────────────────
export async function scanFavoritesQuality(
  favorites: RadioStation[],
  updateFavorite: (station: RadioStation) => void,
): Promise<number> {
  let replacedCount = 0;

  for (const station of favorites) {
    if (!station.logo) continue;
    // Already placeholder → skip
    if (station.logo === stationPlaceholder) continue;

    const result = await validateImage(station.logo);
    if (result !== "OK") {
      // Replace directly in favorites storage
      updateFavorite({ ...station, logo: stationPlaceholder });
      replacedCount++;
    }
  }

  return replacedCount;
}

export { stationPlaceholder };

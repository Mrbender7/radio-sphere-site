import { useState, useCallback, useEffect } from "react";
import { RadioStation } from "@/types/radio";

const FAVORITES_KEY = "radioflow_favorites";
const RECENT_KEY = "radioflow_recent";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<RadioStation[]>(() =>
    loadFromStorage<RadioStation[]>(FAVORITES_KEY, []).sort((a, b) => a.name.localeCompare(b.name))
  );

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((station: RadioStation) => {
    setFavorites(prev => {
      const exists = prev.some(s => s.id === station.id);
      const next = exists ? prev.filter(s => s.id !== station.id) : [...prev, station];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
  }, []);

  const isFavorite = useCallback((id: string) => favorites.some(s => s.id === id), [favorites]);

  const updateFavorite = useCallback((station: RadioStation) => {
    setFavorites(prev => prev.map(s => s.id === station.id ? station : s));
  }, []);

  const importFavorites = useCallback((stations: RadioStation[]) => {
    let addedCount = 0;
    setFavorites(prev => {
      const existingUrls = new Map(prev.map(s => [s.streamUrl, s]));
      const newStations: RadioStation[] = [];
      for (const s of stations) {
        const existing = existingUrls.get(s.streamUrl);
        if (existing) {
          // Update metadata if the incoming station has richer data (e.g. logo)
          if (s.logo && !existing.logo) {
            existingUrls.set(s.streamUrl, { ...existing, ...s, id: s.id || existing.id });
          }
        } else {
          newStations.push(s);
          addedCount++;
        }
      }
      const updated = Array.from(existingUrls.values());
      return [...updated, ...newStations].sort((a, b) => a.name.localeCompare(b.name));
    });
    return addedCount;
  }, []);

  return { favorites, toggleFavorite, isFavorite, updateFavorite, importFavorites };
}

export function useRecentStations() {
  const [recent, setRecent] = useState<RadioStation[]>(() => loadFromStorage(RECENT_KEY, []));

  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  }, [recent]);

  const addRecent = useCallback((station: RadioStation) => {
    setRecent(prev => {
      const filtered = prev.filter(s => s.id !== station.id);
      return [station, ...filtered].slice(0, 20);
    });
  }, []);

  return { recent, addRecent };
}

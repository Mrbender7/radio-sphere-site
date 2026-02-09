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
  const [favorites, setFavorites] = useState<RadioStation[]>(() => loadFromStorage(FAVORITES_KEY, []));

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((station: RadioStation) => {
    setFavorites(prev => {
      const exists = prev.some(s => s.id === station.id);
      return exists ? prev.filter(s => s.id !== station.id) : [...prev, station];
    });
  }, []);

  const isFavorite = useCallback((id: string) => favorites.some(s => s.id === id), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
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

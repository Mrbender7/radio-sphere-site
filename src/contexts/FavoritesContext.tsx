import { createContext, useContext, ReactNode } from "react";
import { useFavorites, useRecentStations } from "@/hooks/useFavorites";
import { RadioStation } from "@/types/radio";

interface FavoritesContextType {
  favorites: RadioStation[];
  toggleFavorite: (station: RadioStation) => void;
  isFavorite: (id: string) => boolean;
  importFavorites: (stations: RadioStation[]) => number;
  recent: RadioStation[];
  addRecent: (station: RadioStation) => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { favorites, toggleFavorite, isFavorite, importFavorites } = useFavorites();
  const { recent, addRecent } = useRecentStations();

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, importFavorites, recent, addRecent }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavoritesContext must be used within FavoritesProvider");
  return ctx;
}

import { useState, useRef, useCallback, useMemo } from "react";
import { RadioStation } from "@/types/radio";
import { StationCard, StationViewMode } from "@/components/StationCard";
import { Heart, ArrowUp, List, Grid3x3, LayoutGrid, Grip } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface LibraryPageProps {
  favorites: RadioStation[];
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (station: RadioStation) => void;
}

export function LibraryPage({ favorites, isFavorite, onToggleFavorite }: LibraryPageProps) {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sortMode, setSortMode] = useState<"name" | "country" | "genre">(() => {
    try { const v = localStorage.getItem("radiosphere_sort_mode"); if (v === "name" || v === "country" || v === "genre") return v; } catch {}
    return "name";
  });
  const updateSortMode = useCallback((mode: "name" | "country" | "genre") => {
    setSortMode(mode);
    try { localStorage.setItem("radiosphere_sort_mode", mode); } catch {}
  }, []);
  const [viewMode, setViewMode] = useState<StationViewMode>(() => {
    try { const v = localStorage.getItem("radiosphere_view_mode"); if (v) return v as StationViewMode; } catch {}
    return "list";
  });
  const updateViewMode = useCallback((mode: StationViewMode) => {
    setViewMode(mode);
    try { localStorage.setItem("radiosphere_view_mode", mode); } catch {}
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) setShowScrollTop(el.scrollTop > 300);
  }, []);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const groupedByCountry = useMemo(() => {
    const groups: Record<string, RadioStation[]> = {};
    for (const s of favorites) {
      const country = s.country || t("favorites.unknownCountry");
      if (!groups[country]) groups[country] = [];
      groups[country].push(s);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([country, stations]) => ({
        country,
        stations: stations.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [favorites, t]);

  const groupedByGenre = useMemo(() => {
    const groups: Record<string, RadioStation[]> = {};
    for (const s of favorites) {
      const genre = s.tags[0]?.toLowerCase() || t("favorites.unknownGenre");
      if (!groups[genre]) groups[genre] = [];
      groups[genre].push(s);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([genre, stations]) => ({
        genre: genre.charAt(0).toUpperCase() + genre.slice(1),
        stations: stations.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [favorites, t]);

  const gridClass =
    viewMode === "small"
      ? "grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-9 gap-1.5"
      : viewMode === "medium"
        ? "grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2"
        : viewMode === "large"
          ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          : "space-y-1";

  const renderStations = (stations: RadioStation[]) => (
    <div key={viewMode} className={cn(gridClass, "animate-fade-in")}>
      {stations.map(s => (
        <StationCard key={s.id} station={s} viewMode={viewMode} isFavorite={isFavorite(s.id)} onToggleFavorite={onToggleFavorite} />
      ))}
    </div>
  );

  const viewModes: { mode: StationViewMode; icon: typeof List; labelKey: string }[] = [
    { mode: "small", icon: Grip, labelKey: "favorites.viewSmall" },
    { mode: "list", icon: List, labelKey: "favorites.viewList" },
    { mode: "medium", icon: Grid3x3, labelKey: "favorites.viewMedium" },
    { mode: "large", icon: LayoutGrid, labelKey: "favorites.viewLarge" },
  ];

  return (
    <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 lg:px-8 pb-32">
      <h1 className="text-2xl lg:text-3xl font-heading font-bold mt-6 mb-2 bg-gradient-to-r from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] bg-clip-text text-transparent flex items-center gap-2">
        {t("favorites.title")}
        {favorites.length > 0 && (
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[hsl(280,80%,60%)] text-white leading-none">{favorites.length}</span>
        )}
      </h1>

      {favorites.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Sort buttons */}
          <button
            onClick={() => updateSortMode("name")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-full transition-all",
              sortMode === "name" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {t("favorites.sortName")}
          </button>
          <button
            onClick={() => updateSortMode("country")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-full transition-all",
              sortMode === "country" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {t("favorites.sortCountry")}
          </button>
          <button
            onClick={() => setSortMode("genre")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-full transition-all",
              sortMode === "genre" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {t("favorites.sortGenre")}
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          {/* View mode toggles */}
          {viewModes.map(({ mode, icon: Icon, labelKey }) => (
            <button
              key={mode}
              onClick={() => updateViewMode(mode)}
              title={t(labelKey)}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              )}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">{t("favorites.empty")}</h2>
          <p className="text-sm text-muted-foreground max-w-[250px]">{t("favorites.emptyDesc")}</p>
        </div>
      ) : sortMode === "name" ? (
        renderStations(favorites)
      ) : sortMode === "country" ? (
        <div className="space-y-4">
          {groupedByCountry.map(({ country, stations }) => (
            <div key={country}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{country}</h3>
              {renderStations(stations)}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByGenre.map(({ genre, stations }) => (
            <div key={genre}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{genre}</h3>
              {renderStations(stations)}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-48 right-4 z-50 w-10 h-10 rounded-full bg-primary/70 backdrop-blur-sm text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-300",
          showScrollTop ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}

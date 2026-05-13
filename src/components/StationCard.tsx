import { RadioStation } from "@/types/radio";
import { usePlayer } from "@/contexts/PlayerContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { Heart, Play } from "lucide-react";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { SmartArtwork } from "@/components/SmartArtwork";
import { cn } from "@/lib/utils";
import { useStreamPrefetch } from "@/hooks/useStreamPrefetch";
import type { KeyboardEvent, MouseEvent } from "react";

export type StationViewMode = "small" | "list" | "medium" | "large";
interface StationCardProps {
  station: RadioStation;
  isFavorite: boolean;
  onToggleFavorite: (station: RadioStation) => void;
  compact?: boolean;
  viewMode?: StationViewMode;
}

export function StationCard({ station, isFavorite, onToggleFavorite, compact, viewMode }: StationCardProps) {
  const { play, currentStation, isPlaying } = usePlayer();
  const { t } = useTranslation();
  const { onHover, onLeave } = useStreamPrefetch();
  const isActive = currentStation?.id === station.id;

  const favLabel = isFavorite ? t("aria.removeFavorite") : t("aria.addFavorite");
  const playLabel = isPlaying && isActive ? t("aria.pause") : t("aria.play");

  // Card behaves as a button without being an actual <button>, so the inner
  // favorite <button> doesn't produce invalid <button> in <button> nesting
  // (cause of React hydration error #418 in production).
  const handleCardActivate = () => play(station);
  const handleCardKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      play(station);
    }
  };
  const handleFavClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onToggleFavorite(station);
  };

  const cardA11y = {
    role: "button" as const,
    tabIndex: 0,
    "aria-label": `${playLabel} ${station.name}`,
    onClick: handleCardActivate,
    onKeyDown: handleCardKey,
    onPointerEnter: () => onHover(station),
    onPointerLeave: () => onLeave(station),
  };

  // viewMode takes priority over compact
  const mode = viewMode ?? (compact ? "list" : undefined);

  if (mode === "small") {
    return (
      <div
        {...cardA11y}
        className="relative flex flex-col items-center w-full p-1 rounded-lg transition-all duration-300 ease-out group hover:scale-105 hover:drop-shadow-[0_4px_12px_hsl(var(--primary)/0.3)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className={cn("relative w-full aspect-square rounded-lg bg-accent overflow-hidden shadow-md", isActive && isPlaying && "animate-card-glow")}>
          <SmartArtwork stationId={station.id} originalUrl={station.logo} homepage={station.homepage} stationName={station.name} alt={`Écouter ${station.name} en direct sur RadioSphere.be`} />
          {isActive && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
              {isPlaying ? <AudioVisualizer size="small" /> : <Play className="w-5 h-5 text-white" />}
            </div>
          )}
          <button
            type="button"
            onClick={handleFavClick}
            aria-label={favLabel}
            className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/30 backdrop-blur-sm z-10"
          >
            <Heart className={cn("w-2.5 h-2.5", isFavorite ? "fill-[hsl(280,80%,60%)] text-[hsl(280,80%,60%)]" : "text-white/80")} />
          </button>
        </div>
        <p className="mt-0.5 text-[10px] font-semibold truncate w-full text-center bg-gradient-to-r from-primary to-[hsl(280,80%,60%)] bg-clip-text text-transparent">
          {station.name}
        </p>
      </div>
    );
  }

  if (mode === "list") {
    return (
      <div
        {...cardA11y}
        className={cn(
          "flex items-center gap-3 w-full p-3 rounded-lg transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary",
          isActive ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-accent"
        )}
      >
        <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center overflow-hidden flex-shrink-0">
          <SmartArtwork stationId={station.id} originalUrl={station.logo} homepage={station.homepage} stationName={station.name} alt={`Écouter ${station.name} en direct sur RadioSphere.be`} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className={cn("text-sm font-medium truncate", isActive && "text-primary")}>{station.name}</p>
          <p className="text-xs text-muted-foreground truncate">{station.country}{station.tags[0] ? ` • ${station.tags[0]}` : ''}</p>
        </div>
        {isActive && isPlaying && (
          <AudioVisualizer size="small" />
        )}
        <button
          type="button"
          onClick={handleFavClick}
          aria-label={favLabel}
          className="p-1.5"
        >
          <Heart className={cn("w-4 h-4", isFavorite ? "fill-[hsl(280,80%,60%)] text-[hsl(280,80%,60%)]" : "text-muted-foreground")} />
        </button>
      </div>
    );
  }

  if (mode === "medium") {
    return (
      <div
        {...cardA11y}
        className="relative flex flex-col items-center w-full p-2 rounded-xl transition-colors group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className={cn("relative w-full aspect-square rounded-xl bg-accent overflow-hidden shadow-lg", isActive && isPlaying && "animate-card-glow")}>
          <SmartArtwork stationId={station.id} originalUrl={station.logo} homepage={station.homepage} stationName={station.name} alt={`Écouter ${station.name} en direct sur RadioSphere.be`} />
          {isActive && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
              {isPlaying ? <AudioVisualizer size="small" /> : <Play className="w-8 h-8 text-white" />}
            </div>
          )}
          <button
            type="button"
            onClick={handleFavClick}
            aria-label={favLabel}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/30 backdrop-blur-sm z-10"
          >
            <Heart className={cn("w-3.5 h-3.5", isFavorite ? "fill-[hsl(280,80%,60%)] text-[hsl(280,80%,60%)]" : "text-white/80")} />
          </button>
        </div>
        <p className="mt-1.5 text-xs font-semibold truncate w-full text-center bg-gradient-to-r from-primary to-[hsl(280,80%,60%)] bg-clip-text text-transparent">
          {station.name}
        </p>
      </div>
    );
  }

  if (mode === "large") {
    return (
      <div
        {...cardA11y}
        className="relative flex flex-col items-center w-full p-2 rounded-xl transition-colors group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className={cn("relative w-full aspect-square rounded-xl bg-accent overflow-hidden shadow-lg", isActive && isPlaying && "animate-card-glow")}>
          <SmartArtwork stationId={station.id} originalUrl={station.logo} homepage={station.homepage} stationName={station.name} alt={`Écouter ${station.name} en direct sur RadioSphere.be`} />
          {isActive && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
              {isPlaying ? <AudioVisualizer size="small" /> : <Play className="w-10 h-10 text-white" />}
            </div>
          )}
          <button
            type="button"
            onClick={handleFavClick}
            aria-label={favLabel}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/30 backdrop-blur-sm z-10"
          >
            <Heart className={cn("w-4 h-4", isFavorite ? "fill-[hsl(280,80%,60%)] text-[hsl(280,80%,60%)]" : "text-white/80")} />
          </button>
        </div>
        <p className="mt-2 text-sm font-bold truncate w-full text-center bg-gradient-to-r from-primary to-[hsl(280,80%,60%)] bg-clip-text text-transparent">
          {station.name}
        </p>
        <p className="text-[11px] text-muted-foreground truncate w-full text-center">{station.country}</p>
      </div>
    );
  }

  // Default: small thumbnail (used in HomePage scrollables)
  return (
    <div
      {...cardA11y}
      className="relative flex flex-col items-center w-[7.5rem] flex-shrink-0 p-2 rounded-xl transition-all duration-300 ease-out group hover:scale-105 hover:drop-shadow-[0_4px_12px_hsl(var(--primary)/0.3)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className={cn("relative w-[5.5rem] h-[5.5rem] rounded-xl bg-accent mb-1.5 overflow-hidden shadow-lg", isActive && isPlaying && "animate-card-glow")}>
        <SmartArtwork stationId={station.id} originalUrl={station.logo} homepage={station.homepage} stationName={station.name} alt={`Écouter ${station.name} en direct sur RadioSphere.be`} />
        {isActive && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
            {isPlaying ? (
              <AudioVisualizer size="small" />
            ) : (
              <Play className="w-8 h-8 text-white" />
            )}
          </div>
        )}
        <button
          type="button"
          onClick={handleFavClick}
          aria-label={favLabel}
          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/30 backdrop-blur-sm z-10"
        >
          <Heart className={cn("w-3.5 h-3.5", isFavorite ? "fill-[hsl(280,80%,60%)] text-[hsl(280,80%,60%)]" : "text-white/80")} />
        </button>
      </div>
      <p className="text-xs font-medium text-foreground truncate w-full text-center">{station.name}</p>
      <p className="text-[10px] text-muted-foreground truncate w-full text-center">{station.country}</p>
    </div>
  );
}

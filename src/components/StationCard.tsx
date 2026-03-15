import { RadioStation } from "@/types/radio";
import { usePlayer } from "@/contexts/PlayerContext";
import { Heart, Play } from "lucide-react";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { SmartArtwork } from "@/components/SmartArtwork";
import { cn } from "@/lib/utils";

export type StationViewMode = "list" | "medium" | "large";

interface StationCardProps {
  station: RadioStation;
  isFavorite: boolean;
  onToggleFavorite: (station: RadioStation) => void;
  compact?: boolean;
  viewMode?: StationViewMode;
}

export function StationCard({ station, isFavorite, onToggleFavorite, compact, viewMode }: StationCardProps) {
  const { play, currentStation, isPlaying } = usePlayer();
  const isActive = currentStation?.id === station.id;

  // viewMode takes priority over compact
  const mode = viewMode ?? (compact ? "list" : undefined);

  if (mode === "list") {
    return (
      <button
        onClick={() => play(station)}
        className={cn(
          "flex items-center gap-3 w-full p-3 rounded-lg transition-colors",
          isActive ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-accent"
        )}
      >
        <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center overflow-hidden flex-shrink-0">
          <SmartArtwork stationId={station.id} originalUrl={station.logo} homepage={station.homepage} stationName={station.name} alt={station.name} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className={cn("text-sm font-medium truncate", isActive && "text-primary")}>{station.name}</p>
          <p className="text-xs text-muted-foreground truncate">{station.country}{station.tags[0] ? ` • ${station.tags[0]}` : ''}</p>
        </div>
        {isActive && isPlaying && (
          <AudioVisualizer size="small" />
        )}
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite(station); }}
          className="p-1.5"
        >
          <Heart className={cn("w-4 h-4", isFavorite ? "fill-[hsl(280,80%,60%)] text-[hsl(280,80%,60%)]" : "text-muted-foreground")} />
        </button>
      </button>
    );
  }

  if (mode === "medium") {
    return (
      <button
        onClick={() => play(station)}
        className="relative flex flex-col items-center w-full p-2 rounded-xl transition-colors group"
      >
        <div className={cn("relative w-full aspect-square rounded-xl bg-accent overflow-hidden shadow-lg", isActive && isPlaying && "animate-card-glow")}>
          <SmartArtwork stationId={station.id} originalUrl={station.logo} homepage={station.homepage} stationName={station.name} alt={station.name} />
          {isActive && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
              {isPlaying ? <AudioVisualizer size="small" /> : <Play className="w-8 h-8 text-white" />}
            </div>
          )}
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite(station); }}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/30 backdrop-blur-sm z-10"
          >
            <Heart className={cn("w-3.5 h-3.5", isFavorite ? "fill-[hsl(280,80%,60%)] text-[hsl(280,80%,60%)]" : "text-white/80")} />
          </button>
        </div>
        <p className="mt-1.5 text-xs font-semibold truncate w-full text-center bg-gradient-to-r from-primary to-[hsl(280,80%,60%)] bg-clip-text text-transparent">
          {station.name}
        </p>
      </button>
    );
  }

  if (mode === "large") {
    return (
      <button
        onClick={() => play(station)}
        className="relative flex flex-col items-center w-full p-2 rounded-xl transition-colors group"
      >
        <div className={cn("relative w-full aspect-square rounded-xl bg-accent overflow-hidden shadow-lg", isActive && isPlaying && "animate-card-glow")}>
          <SmartArtwork stationId={station.id} originalUrl={station.logo} homepage={station.homepage} stationName={station.name} alt={station.name} />
          {isActive && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
              {isPlaying ? <AudioVisualizer size="small" /> : <Play className="w-10 h-10 text-white" />}
            </div>
          )}
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite(station); }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/30 backdrop-blur-sm z-10"
          >
            <Heart className={cn("w-4 h-4", isFavorite ? "fill-[hsl(280,80%,60%)] text-[hsl(280,80%,60%)]" : "text-white/80")} />
          </button>
        </div>
        <p className="mt-2 text-sm font-bold truncate w-full text-center bg-gradient-to-r from-primary to-[hsl(280,80%,60%)] bg-clip-text text-transparent">
          {station.name}
        </p>
        <p className="text-[11px] text-muted-foreground truncate w-full text-center">{station.country}</p>
      </button>
    );
  }

  // Default: small thumbnail (used in HomePage scrollables)
  return (
    <button
      onClick={() => play(station)}
      className="relative flex flex-col items-center w-[7.5rem] flex-shrink-0 p-2 rounded-xl transition-colors"
    >
      <div className={cn("relative w-[5.5rem] h-[5.5rem] rounded-xl bg-accent mb-1.5 overflow-hidden shadow-lg", isActive && isPlaying && "animate-card-glow")}>
        <SmartArtwork stationId={station.id} originalUrl={station.logo} homepage={station.homepage} stationName={station.name} alt={station.name} />
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
          onClick={e => { e.stopPropagation(); onToggleFavorite(station); }}
          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/30 backdrop-blur-sm z-10"
        >
          <Heart className={cn("w-3.5 h-3.5", isFavorite ? "fill-[hsl(280,80%,60%)] text-[hsl(280,80%,60%)]" : "text-white/80")} />
        </button>
      </div>
      <p className="text-xs font-medium text-foreground truncate w-full text-center">{station.name}</p>
      <p className="text-[10px] text-muted-foreground truncate w-full text-center">{station.country}</p>
    </button>
  );
}

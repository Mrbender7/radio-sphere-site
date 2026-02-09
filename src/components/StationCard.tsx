import { RadioStation } from "@/types/radio";
import { usePlayer } from "@/contexts/PlayerContext";
import { Heart, Play, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface StationCardProps {
  station: RadioStation;
  isFavorite: boolean;
  onToggleFavorite: (station: RadioStation) => void;
  compact?: boolean;
}

export function StationCard({ station, isFavorite, onToggleFavorite, compact }: StationCardProps) {
  const { play, currentStation, isPlaying } = usePlayer();
  const isActive = currentStation?.id === station.id;

  if (compact) {
    return (
      <button
        onClick={() => play(station)}
        className={cn(
          "flex items-center gap-3 w-full p-3 rounded-lg transition-colors",
          isActive ? "bg-primary/10" : "hover:bg-accent"
        )}
      >
        <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center overflow-hidden flex-shrink-0">
          {station.logo ? (
            <img src={station.logo} alt={station.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <Radio className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className={cn("text-sm font-medium truncate", isActive && "text-primary")}>{station.name}</p>
          <p className="text-xs text-muted-foreground truncate">{station.country}{station.tags[0] ? ` • ${station.tags[0]}` : ''}</p>
        </div>
        {isActive && isPlaying && (
          <div className="flex gap-0.5 items-end h-4">
            <span className="w-1 bg-primary rounded-full animate-pulse" style={{ height: '60%' }} />
            <span className="w-1 bg-primary rounded-full animate-pulse" style={{ height: '100%', animationDelay: '0.15s' }} />
            <span className="w-1 bg-primary rounded-full animate-pulse" style={{ height: '40%', animationDelay: '0.3s' }} />
          </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite(station); }}
          className="p-1.5"
        >
          <Heart className={cn("w-4 h-4", isFavorite ? "fill-primary text-primary" : "text-muted-foreground")} />
        </button>
      </button>
    );
  }

  return (
    <button
      onClick={() => play(station)}
      className="group relative flex flex-col items-center w-36 flex-shrink-0 p-3 rounded-xl hover:bg-accent transition-colors"
    >
      <div className="relative w-28 h-28 rounded-xl bg-accent mb-2 overflow-hidden shadow-lg">
        {station.logo ? (
          <img src={station.logo} alt={station.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Radio className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-8 h-8 text-white" />
        </div>
      </div>
      <p className="text-xs font-medium text-foreground truncate w-full text-center">{station.name}</p>
      <p className="text-[10px] text-muted-foreground truncate w-full text-center">{station.country}</p>
    </button>
  );
}

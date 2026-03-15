import { usePlayer } from "@/contexts/PlayerContext";
import { useFavoritesContext } from "@/contexts/FavoritesContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { Play, Pause, Heart, Loader2, Volume2, VolumeX, Radio, Cast, Maximize2 } from "lucide-react";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { Slider } from "@/components/ui/slider";
import { CastButton } from "@/components/CastButton";
import stationPlaceholder from "@/assets/station-placeholder.png";

export function DesktopPlayerBar() {
  const {
    currentStation, isPlaying, isBuffering, togglePlay,
    volume, setVolume, openFullScreen, isCasting, castDeviceName,
  } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const { t } = useTranslation();

  if (!currentStation) {
    return (
      <div className="hidden lg:flex items-center justify-center h-20 bg-secondary/60 backdrop-blur-lg border-t border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Radio className="w-5 h-5" />
          <span className="text-sm">{t("player.selectStation") || "Sélectionnez une station pour commencer"}</span>
        </div>
      </div>
    );
  }

  const fav = isFavorite(currentStation.id);

  return (
    <div className="hidden lg:flex items-center h-20 bg-secondary/60 backdrop-blur-lg border-t border-border px-6 gap-6">
      {/* Left: Station info */}
      <div className="flex items-center gap-4 w-80 flex-shrink-0">
        <div
          className="w-14 h-14 rounded-lg bg-accent overflow-hidden flex-shrink-0 cursor-pointer hover:shadow-lg hover:shadow-primary/20 transition-shadow"
          onClick={openFullScreen}
          style={{ boxShadow: '0 4px 20px -4px hsla(250, 80%, 50%, 0.4)' }}
        >
          {currentStation.logo ? (
            <img
              src={currentStation.logo.replace('http://', 'https://')}
              alt={currentStation.name}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).src = stationPlaceholder; }}
            />
          ) : (
            <img src={stationPlaceholder} alt={currentStation.name} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-heading font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(280,80%,60%)] bg-clip-text text-transparent truncate">
            {currentStation.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {currentStation.tags.length > 0 ? currentStation.tags.slice(0, 2).join(' • ') : currentStation.country}
          </p>
          {isCasting && castDeviceName && (
            <div className="flex items-center gap-1 mt-0.5">
              <Cast className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-primary font-medium">{castDeviceName}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => toggleFavorite(currentStation)}
          className="p-2 rounded-full hover:bg-accent transition-colors flex-shrink-0"
        >
          <Heart className={`w-5 h-5 ${fav ? "fill-[hsl(280,80%,60%)] text-[hsl(280,80%,60%)]" : "text-muted-foreground"}`} />
        </button>
      </div>

      {/* Center: Controls */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1">
        {/* LIVE badge */}
        <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${isPlaying ? "text-green-400 live-pulse" : "text-red-400"}`}>
          <Radio className="w-3 h-3" />
          {t("player.live")}
        </div>
        <div className="flex items-center gap-4">
          {isPlaying && <AudioVisualizer size="medium" />}
          <button
            onClick={togglePlay}
            data-umami-event="play-clicked"
            className={`w-12 h-12 rounded-full bg-gradient-to-b from-primary to-primary/80 border-t border-white/20 flex items-center justify-center text-primary-foreground transition-all ${isPlaying ? "animate-play-breathe" : "shadow-lg shadow-primary/50"}`}
          >
            {isBuffering ? <Loader2 className="w-5 h-5 animate-spin" /> : isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          {isPlaying && <AudioVisualizer size="medium" />}
        </div>
      </div>

      {/* Right: Volume + actions */}
      <div className="flex items-center gap-3 w-64 flex-shrink-0 justify-end">
        <CastButton />
        <button onClick={openFullScreen} className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 w-36">
          <button onClick={() => setVolume(volume > 0 ? 0 : 0.7)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <Slider
            value={[volume * 100]}
            onValueChange={([v]) => setVolume(v / 100)}
            max={100}
            step={1}
            className="flex-1 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-[hsl(var(--primary))] [&_[role=slider]]:to-[hsl(280,80%,60%)] [&_[role=slider]]:border-0 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_.absolute]:bg-gradient-to-r [&_.absolute]:from-[hsl(var(--primary))] [&_.absolute]:to-[hsl(280,80%,60%)]"
          />
        </div>
      </div>
    </div>
  );
}

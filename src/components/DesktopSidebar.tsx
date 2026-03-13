import { Home, Compass, Heart, Info, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import { useFavoritesContext } from "@/contexts/FavoritesContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { SmartArtwork } from "@/components/SmartArtwork";
import type { TabId } from "@/components/BottomNav";
import radioSphereLogo from "@/assets/new-radio-logo.png";

const navItems = [
  { id: "home" as TabId, labelKey: "nav.home", icon: Home },
  { id: "search" as TabId, labelKey: "nav.explore", icon: Compass },
  { id: "library" as TabId, labelKey: "nav.favorites", icon: Heart },
  { id: "about" as TabId, labelKey: "nav.about", icon: Info },
];

interface DesktopSidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function DesktopSidebar({ activeTab, onTabChange }: DesktopSidebarProps) {
  const { t } = useTranslation();
  const { favorites } = useFavoritesContext();
  const { play, currentStation, isPlaying } = usePlayer();

  return (
    <aside className="hidden lg:flex flex-col w-72 h-full bg-sidebar border-r border-sidebar-border flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <img
          src={radioSphereLogo}
          alt="Radio Sphere"
          className="w-11 h-11 rounded-xl mix-blend-screen animate-logo-glow"
        />
        <h1 className="text-xl font-heading font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(280,80%,60%)] bg-clip-text text-transparent">
          Radio Sphere
        </h1>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-1">
        {navItems.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              activeTab === id
                ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <Icon className="w-5 h-5" />
            {t(labelKey)}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-6 my-4 h-px bg-sidebar-border" />

      {/* Quick Favorites */}
      <div className="flex-1 min-h-0 flex flex-col px-3">
        <h3 className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("nav.favorites")}
        </h3>
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
          {favorites.length === 0 ? (
            <p className="px-4 text-xs text-muted-foreground">{t("home.noFavorites")}</p>
          ) : (
            favorites.slice(0, 30).map((station) => {
              const isActive = currentStation?.id === station.id;
              return (
                <button
                  key={station.id}
                  onClick={() => play(station)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                  )}
                >
                  <div className="w-8 h-8 rounded-md bg-accent overflow-hidden flex-shrink-0">
                    <SmartArtwork
                      stationId={station.id}
                      originalUrl={station.logo}
                      homepage={station.homepage}
                      stationName={station.name}
                      alt={station.name}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{station.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{station.country}</p>
                  </div>
                  {isActive && isPlaying && <AudioVisualizer size="small" />}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* App download CTA */}
      <div className="px-4 pb-6 pt-4">
        <div className="rounded-xl bg-gradient-to-br from-primary/20 to-[hsl(280,80%,60%,0.15)] border border-primary/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">{t("app.downloadTitle")}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
            {t("app.downloadDesc")}
          </p>
          <button
            className="w-full py-2 rounded-lg bg-gradient-to-r from-primary to-[hsl(280,80%,60%)] text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            onClick={() => window.open("#", "_blank")}
          >
            {t("app.downloadBtn")}
          </button>
        </div>
      </div>
    </aside>
  );
}

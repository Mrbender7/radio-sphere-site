import { useState } from "react";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { useFavorites, useRecentStations } from "@/hooks/useFavorites";
import { BottomNav, TabId } from "@/components/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";
import { FullScreenPlayer } from "@/components/FullScreenPlayer";
import { HomePage } from "@/pages/HomePage";
import { SearchPage } from "@/pages/SearchPage";
import { LibraryPage } from "@/pages/LibraryPage";
import { PremiumPage } from "@/pages/PremiumPage";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { recent, addRecent } = useRecentStations();

  return (
    <PlayerProvider onStationPlay={addRecent}>
      <div className="flex flex-col h-full bg-background">
        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === "home" && <HomePage recent={recent} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />}
          {activeTab === "search" && <SearchPage isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />}
          {activeTab === "library" && <LibraryPage favorites={favorites} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />}
          {activeTab === "premium" && <PremiumPage />}
        </div>

        {/* Mini Player */}
        <MiniPlayer />

        {/* Bottom Nav */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Full Screen Player Overlay */}
        <FullScreenPlayer />
      </div>
    </PlayerProvider>
  );
};

export default Index;

import { useState, useCallback } from "react";
import { usePlayer } from "@/contexts/PlayerContext";

import { useFavoritesContext } from "@/contexts/FavoritesContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { SleepTimerProvider } from "@/contexts/SleepTimerContext";
import { BottomNav, TabId } from "@/components/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";
import { FullScreenPlayer } from "@/components/FullScreenPlayer";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { DesktopPlayerBar } from "@/components/DesktopPlayerBar";

import { HomePage } from "@/pages/HomePage";
import { SearchPage } from "@/pages/SearchPage";
import { LibraryPage } from "@/pages/LibraryPage";
import { AboutPage } from "@/pages/AboutPage";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";
import { WelcomePage } from "@/pages/WelcomePage";
import { ExitConfirmDialog } from "@/components/ExitConfirmDialog";
import { SleepTimerIndicator } from "@/components/SleepTimerIndicator";
import { useBackButton } from "@/hooks/useBackButton";
import type { Language } from "@/i18n/translations";


const ONBOARDING_KEY = "radiosphere_onboarded";

function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return false;
  }
}

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showWelcome, setShowWelcome] = useState(!hasCompletedOnboarding());
  const [showPrivacy, setShowPrivacy] = useState(false);
  const { favorites, toggleFavorite, isFavorite, recent } = useFavoritesContext();
  const { isFullScreen, closeFullScreen, currentStation } = usePlayer();
  const { setLanguage } = useTranslation();

  const handleTagClick = useCallback((tag: string) => {
    setSelectedGenre(tag);
    setActiveTab("search");
  }, []);

  const handleTabChange = useCallback((tab: TabId) => {
    if (tab !== "search") setSelectedGenre(undefined);
    setShowPrivacy(false);
    setActiveTab(tab);
  }, []);

  const handleWelcomeComplete = useCallback((lang: Language) => {
    setLanguage(lang);
    try { localStorage.setItem(ONBOARDING_KEY, "true"); } catch {}
    setShowWelcome(false);
  }, [setLanguage]);

  const handleReopenWelcome = useCallback(() => {
    setShowWelcome(true);
  }, []);

  const handleResetApp = useCallback(async () => {
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
    try {
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        if (db.name) window.indexedDB.deleteDatabase(db.name);
      }
    } catch {}
    window.location.reload();
  }, []);

  const handleNavigatePrivacy = useCallback(() => {
    setShowPrivacy(true);
    setActiveTab("about");
  }, []);

  useBackButton({
    onBack: () => {
      if (showWelcome) return;
      if (isFullScreen) {
        closeFullScreen();
      } else if (showPrivacy) {
        setShowPrivacy(false);
      } else {
        setActiveTab("home");
      }
    },
    onDoubleBackHome: () => setShowExitDialog(true),
    isHome: activeTab === "home",
    isFullScreen,
  });

  if (showWelcome) {
    return <WelcomePage onComplete={handleWelcomeComplete} />;
  }

  const renderContent = () => {
    if (showPrivacy) {
      return <PrivacyPolicyPage onBack={() => setShowPrivacy(false)} />;
    }
    switch (activeTab) {
      case "home":
        return <HomePage recent={recent} favorites={favorites} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} onGenreClick={handleTagClick} />;
      case "search":
        return <SearchPage isFavorite={isFavorite} onToggleFavorite={toggleFavorite} initialGenre={selectedGenre} />;
      case "library":
        return <LibraryPage favorites={favorites} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />;
      case "about":
        return <AboutPage onReopenWelcome={handleReopenWelcome} onResetApp={handleResetApp} onNavigatePrivacy={handleNavigatePrivacy} />;
      default:
        return null;
    }
  };

  return (
    <SleepTimerProvider>
        <SleepTimerIndicator />
        <div className="flex h-full bg-background">
          {/* Desktop sidebar */}
          <DesktopSidebar activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Main area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Content */}
            <div
              className={`flex-1 flex flex-col overflow-hidden ${currentStation ? 'pb-28 lg:pb-0' : 'pb-14 lg:pb-0'}`}
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
              {renderContent()}
            </div>

            {/* Mobile: MiniPlayer + BottomNav */}
            <MiniPlayer />
            <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

            {/* Desktop: Player bar */}
            <DesktopPlayerBar />
          </div>
        </div>

        <FullScreenPlayer onTagClick={handleTagClick} />
        <ExitConfirmDialog open={showExitDialog} onOpenChange={setShowExitDialog} />
      </SleepTimerProvider>
  );
};

export default Index;

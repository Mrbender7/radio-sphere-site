import { useState, useCallback, useEffect, Suspense, lazy } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Head } from "vite-react-ssg";
import { usePlayer } from "@/contexts/PlayerContext";

import { useFavoritesContext } from "@/contexts/FavoritesContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { SleepTimerProvider } from "@/contexts/SleepTimerContext";
import { BottomNav, TabId } from "@/components/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";
import { FullScreenPlayer } from "@/components/FullScreenPlayer";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { DesktopPlayerBar } from "@/components/DesktopPlayerBar";
import { Footer } from "@/components/Footer";

import { HomePage } from "@/pages/HomePage";
const SearchPage = lazy(() => import("@/pages/SearchPage").then(m => ({ default: m.SearchPage })));
const LibraryPage = lazy(() => import("@/pages/LibraryPage").then(m => ({ default: m.LibraryPage })));
const AboutPage = lazy(() => import("@/pages/AboutPage").then(m => ({ default: m.AboutPage })));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage").then(m => ({ default: m.PrivacyPolicyPage })));

import { WelcomePage } from "@/pages/WelcomePage";
import { ExitConfirmDialog } from "@/components/ExitConfirmDialog";
import { SleepTimerIndicator } from "@/components/SleepTimerIndicator";
import { useBackButton } from "@/hooks/useBackButton";
import type { Language } from "@/i18n/translations";

const ONBOARDING_KEY = "radiosphere_onboarded";

function hasCompletedOnboarding(): boolean {
  try {
    if (typeof window === "undefined") return true; // SSG: skip welcome
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return false;
  }
}

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const ROUTE_TO_TAB: Record<string, TabId> = {
  "/": "home",
  "/search": "search",
  "/library": "library",
  "/about": "about",
};
const TAB_TO_ROUTE: Record<TabId, string> = {
  home: "/",
  search: "/search",
  library: "/library",
  about: "/about",
};

// SEO metadata per tab
const PAGE_META: Record<string, { title: string; description: string }> = {
  home: {
    title: "RadioSphere.be — Radio gratuite sans pub | TimeBack Machine",
    description: "Écoutez 50 000+ stations radio gratuites sans publicité. Découvrez la TimeBack Machine pour réécouter le direct. Streaming HD, Chromecast.",
  },
  search: {
    title: "Rechercher des stations — RadioSphere.be",
    description: "Recherchez parmi 50 000+ stations radio par genre, pays ou langue. Trouvez votre radio préférée sur RadioSphere.be.",
  },
  library: {
    title: "Ma bibliothèque — RadioSphere.be",
    description: "Retrouvez vos stations radio favorites et récemment écoutées. Gérez votre collection sur RadioSphere.be.",
  },
  about: {
    title: "À propos — RadioSphere.be",
    description: "Paramètres, langue, minuterie de sommeil et informations sur RadioSphere.be, votre lecteur radio gratuit sans publicité.",
  },
  privacy: {
    title: "Politique de confidentialité — RadioSphere.be",
    description: "Découvrez comment RadioSphere.be protège vos données. Aucun compte requis, données stockées localement uniquement.",
  },
};

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialTab = ROUTE_TO_TAB[location.pathname] || "home";
  const initialPrivacy = location.pathname === "/privacy";

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showWelcome, setShowWelcome] = useState(!hasCompletedOnboarding());
  const [showPrivacy, setShowPrivacy] = useState(initialPrivacy);
  const { favorites, toggleFavorite, isFavorite, recent } = useFavoritesContext();
  const { isFullScreen, closeFullScreen, currentStation } = usePlayer();
  const { setLanguage } = useTranslation();

  const currentMetaKey = showPrivacy ? "privacy" : activeTab;
  const meta = PAGE_META[currentMetaKey] || PAGE_META.home;

  const handleTagClick = useCallback((tag: string) => {
    setSelectedGenre(tag);
    setActiveTab("search");
  }, []);

  const handleTabChange = useCallback((tab: TabId) => {
    if (tab !== "search") setSelectedGenre(undefined);
    setShowPrivacy(false);
    setActiveTab(tab);
    navigate(TAB_TO_ROUTE[tab] || "/", { replace: true });
  }, [navigate]);

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
    navigate("/privacy", { replace: true });
  }, [navigate]);

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
        <Head>
          <title>{meta.title}</title>
          <meta name="description" content={meta.description} />
          <link rel="canonical" href={`https://radiosphere.be${location.pathname === "/" ? "" : location.pathname}`} />
          <meta property="og:title" content={meta.title} />
          <meta property="og:description" content={meta.description} />
          <meta property="og:url" content={`https://radiosphere.be${location.pathname === "/" ? "" : location.pathname}`} />
        </Head>
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
              <Suspense fallback={<PageLoader />}>
                {renderContent()}
              </Suspense>
            </div>

            {/* Mobile: MiniPlayer + BottomNav */}
            <MiniPlayer />
            <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

            {/* Desktop: Player bar + Footer */}
            <DesktopPlayerBar />
            <Footer />
          </div>
        </div>

        <FullScreenPlayer onTagClick={handleTagClick} />
        <ExitConfirmDialog open={showExitDialog} onOpenChange={setShowExitDialog} />
      </SleepTimerProvider>
  );
};

export default Index;

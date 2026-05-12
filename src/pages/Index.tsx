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
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then(m => ({ default: m.SettingsPage })));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage").then(m => ({ default: m.PrivacyPolicyPage })));

import { WelcomeModal } from "@/components/WelcomeModal";
import { ExitConfirmDialog } from "@/components/ExitConfirmDialog";
import { SleepTimerIndicator } from "@/components/SleepTimerIndicator";
import { InAppBrowserBanner } from "@/components/InAppBrowserBanner";
import { ClientOnly } from "@/components/ClientOnly";
import { useBackButton } from "@/hooks/useBackButton";
import { isInAppBrowser, isLocalStorageWorking } from "@/utils/inAppBrowser";
import { safeGetItem, safeSetItem, safeClearAll } from "@/utils/safeStorage";
import { trackAdLandingOnce } from "@/utils/adLandingTracking";
import type { Language } from "@/i18n/translations";

const ONBOARDING_KEY = "radiosphere_onboarded";

function hasCompletedOnboarding(): boolean {
  try {
    // During SSG build, skip welcome page to render real content for SEO
    if (import.meta.env.SSR) return true;
    // In WebViews where localStorage is broken/partitioned, fall back to
    // sessionStorage so the modal still closes after the user clicks Continue
    // within the same visit (FB Ads campaign — modal is the value pitch,
    // we MUST show it on first arrival).
    if (isInAppBrowser() && !isLocalStorageWorking()) {
      try {
        return sessionStorage.getItem(ONBOARDING_KEY) === "true";
      } catch {
        return false; // ALWAYS show modal in this edge case
      }
    }
    return safeGetItem(ONBOARDING_KEY) === "true";
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
  "/settings": "settings",
  "/about": "about",
};
const TAB_TO_ROUTE: Record<TabId, string> = {
  home: "/",
  search: "/search",
  library: "/library",
  settings: "/settings",
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
  settings: {
    title: "Paramètres — RadioSphere.be",
    description: "Langue, minuterie de sommeil, gestion des favoris et mode d'emploi. Personnalisez votre expérience sur RadioSphere.be.",
  },
  about: {
    title: "À propos — RadioSphere.be",
    description: "Informations, vie privée et sources sur RadioSphere.be, votre lecteur radio gratuit sans publicité.",
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
  // IMPORTANT: must match SSG output (false) at first client render to avoid
  // React hydration mismatch (#418/#423) which freezes the whole app on desktop.
  // We flip it on in a useEffect once hydration is done.
  const [showWelcome, setShowWelcome] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(initialPrivacy);

  useEffect(() => {
    if (!hasCompletedOnboarding()) setShowWelcome(true);
  }, []);
  const { favorites, toggleFavorite, isFavorite, recent } = useFavoritesContext();
  const { isFullScreen, closeFullScreen, currentStation } = usePlayer();
  const { setLanguage } = useTranslation();

  // Fire the FB-ads-campaign landing event once per tab.
  useEffect(() => { trackAdLandingOnce(); }, []);

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
    safeSetItem(ONBOARDING_KEY, "true");
    // Session fallback for in-app browsers where localStorage is unreliable.
    try { sessionStorage.setItem(ONBOARDING_KEY, "true"); } catch { /* noop */ }
    setShowWelcome(false);
  }, [setLanguage]);

  const handleWelcomeOpenChange = useCallback((open: boolean) => {
    setShowWelcome(open);
    if (!open) {
      // Mark onboarding complete even if dismissed via X / overlay / Escape
      safeSetItem(ONBOARDING_KEY, "true");
      try { sessionStorage.setItem(ONBOARDING_KEY, "true"); } catch { /* noop */ }
    }
  }, []);

  const handleReopenWelcome = useCallback(() => {
    setShowWelcome(true);
  }, []);

  const handleResetApp = useCallback(async () => {
    safeClearAll();
    // indexedDB.databases() is non-standard and missing on Chrome WebView/Firefox.
    // Guard with feature detection so the reset never throws.
    try {
      const idb = window.indexedDB as IDBFactory & { databases?: () => Promise<{ name?: string }[]> };
      if (typeof idb?.databases === "function") {
        const dbs = await idb.databases();
        for (const db of dbs) {
          if (db.name) window.indexedDB.deleteDatabase(db.name);
        }
      }
    } catch {}
    // Redirect to home page after reset
    window.location.replace("/");
  }, []);

  const handleNavigatePrivacy = useCallback(() => {
    setShowPrivacy(true);
    setActiveTab("about");
    navigate("/privacy", { replace: true });
  }, [navigate]);

  const handleNavigateSettings = useCallback(() => {
    setShowPrivacy(false);
    setActiveTab("settings");
    navigate("/settings", { replace: true });
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
      case "settings":
        return <SettingsPage onReopenWelcome={handleReopenWelcome} onResetApp={handleResetApp} />;
      case "about":
        return <AboutPage onReopenWelcome={handleReopenWelcome} onNavigatePrivacy={handleNavigatePrivacy} onNavigateSettings={handleNavigateSettings} />;
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
          <meta name="twitter:title" content={meta.title} />
          <meta name="twitter:description" content={meta.description} />
        </Head>
        {/* Dynamic, browser-only chrome — kept out of the SSG HTML so the
            first client render matches the static markup byte-for-byte and
            cannot trigger React hydration mismatches (#418/#421/#423/#425).
            Hidden during SSG also has zero SEO impact (no textual content). */}
        <ClientOnly>
          <SleepTimerIndicator />
          <InAppBrowserBanner />
        </ClientOnly>
        <div className="flex h-full bg-background">
          {/* Desktop sidebar — uses Radix Popover (portals, useId), localStorage
              and language-dependent labels: isolate to client. */}
          <ClientOnly>
            <DesktopSidebar activeTab={activeTab} onTabChange={handleTabChange} />
          </ClientOnly>

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

            {/* Player chrome — entirely client-driven (audio, MediaSession,
                Cast). Excluding it from SSG eliminates any future hydration
                drift and has no SEO cost. */}
            <ClientOnly>
              <MiniPlayer />
              <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
              <DesktopPlayerBar />
              <Footer />
            </ClientOnly>
          </div>
        </div>

        <ClientOnly>
          <FullScreenPlayer onTagClick={handleTagClick} />
          <ExitConfirmDialog open={showExitDialog} onOpenChange={setShowExitDialog} />
          <WelcomeModal
            open={showWelcome}
            onOpenChange={handleWelcomeOpenChange}
            onComplete={handleWelcomeComplete}
          />
        </ClientOnly>
      </SleepTimerProvider>
  );
};

export default Index;

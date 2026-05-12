import { jsxs, jsx } from "react/jsx-runtime";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { u as useTranslation, s as safeGetItem, a as safeSetItem, c as cn, S as StationCard } from "../main.mjs";
import { Heart, ArrowUp, Grip, List, Grid3x3, LayoutGrid } from "lucide-react";
import "react-dom";
import "vite-react-ssg";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "react-router-dom";
import "@radix-ui/react-alert-dialog";
import "@radix-ui/react-slot";
import "@radix-ui/react-slider";
import "@radix-ui/react-dialog";
import "@radix-ui/react-popover";
import "@radix-ui/react-select";
function LibraryPage({ favorites, isFavorite, onToggleFavorite }) {
  const { t } = useTranslation();
  const scrollContainerRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sortMode, setSortMode] = useState("name");
  const [viewMode, setViewMode] = useState("list");
  useEffect(() => {
    const storedSort = safeGetItem("radiosphere_sort_mode");
    if (storedSort === "name" || storedSort === "country" || storedSort === "genre") {
      setSortMode(storedSort);
    }
    const storedView = safeGetItem("radiosphere_view_mode");
    if (storedView) setViewMode(storedView);
  }, []);
  const updateSortMode = useCallback((mode) => {
    setSortMode(mode);
    safeSetItem("radiosphere_sort_mode", mode);
  }, []);
  const updateViewMode = useCallback((mode) => {
    setViewMode(mode);
    safeSetItem("radiosphere_view_mode", mode);
  }, []);
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) setShowScrollTop(el.scrollTop > 300);
  }, []);
  const scrollToTop = () => {
    var _a;
    (_a = scrollContainerRef.current) == null ? void 0 : _a.scrollTo({ top: 0, behavior: "smooth" });
  };
  const groupedByCountry = useMemo(() => {
    const groups = {};
    for (const s of favorites) {
      const country = s.country || t("favorites.unknownCountry");
      if (!groups[country]) groups[country] = [];
      groups[country].push(s);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([country, stations]) => ({
      country,
      stations: stations.sort((a, b) => a.name.localeCompare(b.name))
    }));
  }, [favorites, t]);
  const groupedByGenre = useMemo(() => {
    var _a;
    const groups = {};
    for (const s of favorites) {
      const genre = ((_a = s.tags[0]) == null ? void 0 : _a.toLowerCase()) || t("favorites.unknownGenre");
      if (!groups[genre]) groups[genre] = [];
      groups[genre].push(s);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([genre, stations]) => ({
      genre: genre.charAt(0).toUpperCase() + genre.slice(1),
      stations: stations.sort((a, b) => a.name.localeCompare(b.name))
    }));
  }, [favorites, t]);
  const gridClass = viewMode === "small" ? "grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-9 gap-1.5" : viewMode === "medium" ? "grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2" : viewMode === "large" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" : "space-y-1";
  const renderStations = (stations) => /* @__PURE__ */ jsx("div", { className: cn(gridClass, "animate-fade-in"), children: stations.map((s) => /* @__PURE__ */ jsx(StationCard, { station: s, viewMode, isFavorite: isFavorite(s.id), onToggleFavorite }, s.id)) }, viewMode);
  const viewModes = [
    { mode: "small", icon: Grip, labelKey: "favorites.viewSmall" },
    { mode: "list", icon: List, labelKey: "favorites.viewList" },
    { mode: "medium", icon: Grid3x3, labelKey: "favorites.viewMedium" },
    { mode: "large", icon: LayoutGrid, labelKey: "favorites.viewLarge" }
  ];
  return /* @__PURE__ */ jsxs("div", { ref: scrollContainerRef, onScroll: handleScroll, className: "flex-1 overflow-y-auto px-4 lg:px-8 pb-32", children: [
    /* @__PURE__ */ jsxs("h1", { className: "text-2xl lg:text-3xl font-heading font-bold mt-6 mb-2 bg-gradient-to-r from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] bg-clip-text text-transparent flex items-center gap-2", children: [
      t("favorites.title"),
      favorites.length > 0 && /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 text-xs font-bold rounded-full bg-[hsl(280,80%,60%)] text-white leading-none", children: favorites.length })
    ] }),
    favorites.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4 flex-wrap", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => updateSortMode("name"),
          className: cn(
            "px-3 py-1.5 text-xs font-semibold rounded-full transition-all",
            sortMode === "name" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
          ),
          children: t("favorites.sortName")
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => updateSortMode("country"),
          className: cn(
            "px-3 py-1.5 text-xs font-semibold rounded-full transition-all",
            sortMode === "country" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
          ),
          children: t("favorites.sortCountry")
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => updateSortMode("genre"),
          className: cn(
            "px-3 py-1.5 text-xs font-semibold rounded-full transition-all",
            sortMode === "genre" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
          ),
          children: t("favorites.sortGenre")
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "w-px h-5 bg-border mx-1" }),
      viewModes.map(({ mode, icon: Icon, labelKey }) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => updateViewMode(mode),
          title: t(labelKey),
          className: cn(
            "p-1.5 rounded-md transition-all",
            viewMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          ),
          children: /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4" })
        },
        mode
      ))
    ] }),
    favorites.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-center", children: [
      /* @__PURE__ */ jsx(Heart, { className: "w-16 h-16 text-muted-foreground/30 mb-4" }),
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-foreground mb-2", children: t("favorites.empty") }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground max-w-[250px]", children: t("favorites.emptyDesc") })
    ] }) : sortMode === "name" ? renderStations(favorites) : sortMode === "country" ? /* @__PURE__ */ jsx("div", { className: "space-y-4", children: groupedByCountry.map(({ country, stations }) => /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1", children: country }),
      renderStations(stations)
    ] }, country)) }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: groupedByGenre.map(({ genre, stations }) => /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1", children: genre }),
      renderStations(stations)
    ] }, genre)) }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: scrollToTop,
        className: cn(
          "fixed bottom-48 right-4 z-50 w-10 h-10 rounded-full bg-primary/70 backdrop-blur-sm text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-300",
          showScrollTop ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
        ),
        "aria-label": "Scroll to top",
        children: /* @__PURE__ */ jsx(ArrowUp, { className: "w-5 h-5" })
      }
    )
  ] });
}
export {
  LibraryPage
};

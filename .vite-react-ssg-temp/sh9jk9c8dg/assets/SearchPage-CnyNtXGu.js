import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { c as cn, s as safeGetItem, a as safeSetItem, u as useTranslation, g as getCountries, r as radioBrowserProvider, S as StationCard } from "../main.mjs";
import { I as Input } from "./input-6XZgwDxx.js";
import { cva } from "class-variance-authority";
import { Search, X, AlertTriangle, Loader2, ArrowUpDown, Grip, List, Grid3x3, LayoutGrid, ArrowUp, ChevronDown, ChevronUp, Check } from "lucide-react";
import "react-dom";
import "vite-react-ssg";
import "@radix-ui/react-toast";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "react-router-dom";
import "@radix-ui/react-alert-dialog";
import "@radix-ui/react-slot";
import "@radix-ui/react-slider";
import "@radix-ui/react-dialog";
import "@radix-ui/react-popover";
import "@radix-ui/react-select";
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: cn(badgeVariants({ variant }), className), ...props });
}
const FALLBACK_COUNTRIES = [
  { label: "Argentina", value: "Argentina", code: "ar" },
  { label: "Australia", value: "Australia", code: "au" },
  { label: "Austria", value: "Austria", code: "at" },
  { label: "Belgium", value: "Belgium", code: "be" },
  { label: "Brazil", value: "Brazil", code: "br" },
  { label: "Canada", value: "Canada", code: "ca" },
  { label: "Chile", value: "Chile", code: "cl" },
  { label: "China", value: "China", code: "cn" },
  { label: "Colombia", value: "Colombia", code: "co" },
  { label: "Czechia", value: "Czech Republic", code: "cz" },
  { label: "Denmark", value: "Denmark", code: "dk" },
  { label: "Egypt", value: "Egypt", code: "eg" },
  { label: "Finland", value: "Finland", code: "fi" },
  { label: "France", value: "France", code: "fr" },
  { label: "Germany", value: "Germany", code: "de" },
  { label: "Greece", value: "Greece", code: "gr" },
  { label: "India", value: "India", code: "in" },
  { label: "Ireland", value: "Ireland", code: "ie" },
  { label: "Italy", value: "Italy", code: "it" },
  { label: "Japan", value: "Japan", code: "jp" },
  { label: "Mexico", value: "Mexico", code: "mx" },
  { label: "Morocco", value: "Morocco", code: "ma" },
  { label: "Netherlands", value: "Netherlands", code: "nl" },
  { label: "New Zealand", value: "New Zealand", code: "nz" },
  { label: "Norway", value: "Norway", code: "no" },
  { label: "Poland", value: "Poland", code: "pl" },
  { label: "Portugal", value: "Portugal", code: "pt" },
  { label: "Romania", value: "Romania", code: "ro" },
  { label: "South Africa", value: "South Africa", code: "za" },
  { label: "Spain", value: "Spain", code: "es" },
  { label: "Sweden", value: "Sweden", code: "se" },
  { label: "Switzerland", value: "Switzerland", code: "ch" },
  { label: "Turkey", value: "Turkey", code: "tr" },
  { label: "UK", value: "The United Kingdom Of Great Britain And Northern Ireland", code: "gb" },
  { label: "USA", value: "The United States Of America", code: "us" }
];
function buildFlagUrl(code) {
  if (!code || code.length !== 2) return null;
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}
const GENRES = ["60s", "70s", "80s", "90s", "ambient", "blues", "chillout", "classical", "country", "electronic", "funk", "hiphop", "jazz", "latin", "metal", "news", "pop", "r&b", "reggae", "rock", "soul", "techno", "trance", "world"];
const LANGUAGES = ["arabic", "english", "french", "german", "japanese", "portuguese", "spanish"];
const JAPANESE_GENRE_MAP = {
  "ジャズ": "jazz",
  "ロック": "rock",
  "ポップ": "pop",
  "ポップス": "pop",
  "クラシック": "classical",
  "テクノ": "techno",
  "トランス": "trance",
  "ブルース": "blues",
  "ソウル": "soul",
  "ファンク": "funk",
  "メタル": "metal",
  "レゲエ": "reggae",
  "ヒップホップ": "hiphop",
  "エレクトロニック": "electronic",
  "アンビエント": "ambient",
  "カントリー": "country",
  "ラテン": "latin",
  "ニュース": "news",
  "チルアウト": "chillout",
  "ワールド": "world"
};
function resolveJapaneseQuery(q) {
  const trimmed = q.trim();
  const mapped = JAPANESE_GENRE_MAP[trimmed];
  if (mapped) return { query: trimmed, extraTag: mapped };
  return { query: trimmed };
}
function mergeSettled(results) {
  const merged = [];
  for (const r of results) {
    if (r.status === "fulfilled") merged.push(...r.value);
  }
  return merged;
}
function dedupeAndSort(stations, sortBy) {
  const map = /* @__PURE__ */ new Map();
  for (const s of stations) {
    if (!map.has(s.id)) map.set(s.id, s);
  }
  const arr = Array.from(map.values());
  return sortStations(arr, sortBy);
}
function sortStations(stations, sortBy) {
  return [...stations].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name, void 0, { sensitivity: "base" });
    if (sortBy === "clickcount") return (b.clickcount || 0) - (a.clickcount || 0);
    return (b.votes || 0) - (a.votes || 0);
  });
}
function SearchPage({ isFavorite, onToggleFavorite, initialGenre }) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [genres, setGenres] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState("votes");
  const [viewMode, setViewMode] = useState("list");
  useEffect(() => {
    const stored = safeGetItem("radiosphere_view_mode");
    if (stored) setViewMode(stored);
  }, []);
  const updateViewMode = useCallback((mode) => {
    setViewMode(mode);
    safeSetItem("radiosphere_view_mode", mode);
  }, []);
  const { t } = useTranslation();
  const PAGE_SIZE = 40;
  const GENRE_TAG_MAP = {
    mousemusic: ["park", "disney", "disneyland", "children"]
  };
  useEffect(() => {
    if (initialGenre) {
      const expandedTags = GENRE_TAG_MAP[initialGenre];
      if (expandedTags) {
        setGenres(expandedTags);
      } else {
        setGenres([initialGenre]);
      }
      setQuery("");
      setCountry("");
      setLanguages([]);
    }
  }, [initialGenre]);
  const { data: apiCountries, isError: isCountriesError, refetch: retryCountries } = useQuery({
    queryKey: ["countries"],
    queryFn: ({ signal }) => getCountries(signal),
    staleTime: 30 * 60 * 1e3,
    retry: 0
  });
  const countryList = useMemo(() => {
    if (!apiCountries || apiCountries.length === 0) {
      return FALLBACK_COUNTRIES.map((c) => ({ ...c, flagUrl: buildFlagUrl(c.code) }));
    }
    return apiCountries.map((c) => ({
      label: c.name,
      value: c.name,
      code: c.iso_3166_1.toLowerCase(),
      flagUrl: buildFlagUrl(c.iso_3166_1)
    }));
  }, [apiCountries]);
  const usingFallbackCountries = !apiCountries || apiCountries.length === 0;
  const reducedCountryListLabel = t("search.reducedCountryList");
  const hasFilters = !!(query || country || genres.length || languages.length);
  const [extraResults, setExtraResults] = useState([]);
  useEffect(() => {
    setExtraResults([]);
    setOffset(0);
    setHasMore(false);
  }, [query, country, genres, languages, sortBy]);
  const sortReverse = sortBy === "name" ? "false" : "true";
  const scrollContainerRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) setShowScrollTop(el.scrollTop > 300);
  }, []);
  const scrollToTop = () => {
    var _a;
    (_a = scrollContainerRef.current) == null ? void 0 : _a.scrollTo({ top: 0, behavior: "smooth" });
  };
  const { data: results, isLoading, isError: isSearchError, refetch: retrySearch } = useQuery({
    queryKey: ["search", query, country, genres, languages, sortBy],
    queryFn: async ({ signal }) => {
      const resolved = resolveJapaneseQuery(query);
      const searchName = resolved.query;
      const japaneseExtraTag = resolved.extraTag;
      const baseParams = {
        country: country || void 0,
        language: languages.length ? languages.join(",") : void 0,
        limit: PAGE_SIZE,
        offset: 0,
        order: sortBy,
        reverse: sortReverse,
        signal
      };
      const allStations = [];
      if (genres.length > 1) {
        const genreSearches = genres.map(
          (g) => searchName ? radioBrowserProvider.searchStations({ ...baseParams, tag: g, name: searchName }) : radioBrowserProvider.searchStations({ ...baseParams, tag: g })
        );
        if (searchName) {
          genreSearches.push(radioBrowserProvider.searchStations({ ...baseParams, name: searchName }));
        }
        if (japaneseExtraTag) {
          genreSearches.push(radioBrowserProvider.searchStations({ ...baseParams, tag: japaneseExtraTag }));
        }
        const settled = await Promise.allSettled(genreSearches);
        allStations.push(...mergeSettled(settled));
      } else {
        const singleTag = genres.length === 1 ? genres[0] : void 0;
        if (searchName) {
          const searches = [
            radioBrowserProvider.searchStations({ ...baseParams, name: searchName, tag: singleTag })
          ];
          if (singleTag) {
            searches.push(radioBrowserProvider.searchStations({ ...baseParams, name: searchName }));
          } else {
            searches.push(radioBrowserProvider.searchStations({ ...baseParams, tag: searchName }));
          }
          if (japaneseExtraTag) {
            searches.push(radioBrowserProvider.searchStations({ ...baseParams, tag: japaneseExtraTag }));
          }
          const settled = await Promise.allSettled(searches);
          allStations.push(...mergeSettled(settled));
          if (allStations.length === 0 && settled.every((r) => r.status === "rejected")) {
            throw settled[0].status === "rejected" ? settled[0].reason : new Error("Search failed");
          }
        } else {
          if (singleTag) baseParams["tag"] = singleTag;
          const data = await radioBrowserProvider.searchStations(baseParams);
          allStations.push(...data);
        }
      }
      return dedupeAndSort(allStations, sortBy);
    },
    enabled: hasFilters,
    staleTime: 2 * 60 * 1e3,
    retry: 0
  });
  useEffect(() => {
    if (results) {
      setOffset(results.length);
      setHasMore(results.length >= PAGE_SIZE);
      if (extraResults.length > 0) {
        const ids = new Set(results.map((s) => s.id));
        const combined = [...results, ...extraResults.filter((s) => !ids.has(s.id))];
        setAllResults(sortStations(combined, sortBy));
      } else {
        setAllResults(results);
      }
    } else {
      setAllResults([]);
    }
  }, [results, sortBy]);
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const baseParams = {
        country: country || void 0,
        language: languages.length ? languages.join(",") : void 0,
        limit: PAGE_SIZE,
        offset,
        order: sortBy,
        reverse: sortReverse
      };
      const allStations = [];
      if (genres.length > 1) {
        const genreSearches = genres.map(
          (g) => query ? radioBrowserProvider.searchStations({ ...baseParams, tag: g, name: query }) : radioBrowserProvider.searchStations({ ...baseParams, tag: g })
        );
        if (query) {
          genreSearches.push(radioBrowserProvider.searchStations({ ...baseParams, name: query }));
        }
        const settled = await Promise.allSettled(genreSearches);
        allStations.push(...mergeSettled(settled));
      } else {
        const singleTag = genres.length === 1 ? genres[0] : void 0;
        if (query) {
          const searches = [
            radioBrowserProvider.searchStations({ ...baseParams, name: query, tag: singleTag })
          ];
          if (singleTag) {
            searches.push(radioBrowserProvider.searchStations({ ...baseParams, name: query }));
          } else {
            searches.push(radioBrowserProvider.searchStations({ ...baseParams, tag: query }));
          }
          const settled = await Promise.allSettled(searches);
          allStations.push(...mergeSettled(settled));
        } else {
          if (singleTag) baseParams["tag"] = singleTag;
          const data2 = await radioBrowserProvider.searchStations(baseParams);
          allStations.push(...data2);
        }
      }
      const newMap = /* @__PURE__ */ new Map();
      for (const s of allStations) if (!newMap.has(s.id)) newMap.set(s.id, s);
      const data = Array.from(newMap.values());
      setExtraResults((prev) => {
        const ids = new Set(prev.map((s) => s.id));
        return [...prev, ...data.filter((s) => !ids.has(s.id))];
      });
      const existingIds = new Set(allResults.map((x) => x.id));
      const newAll = sortStations([...allResults, ...data.filter((s) => !existingIds.has(s.id))], sortBy);
      setAllResults(newAll);
      setOffset((o) => o + data.length);
      setHasMore(data.length >= PAGE_SIZE);
    } catch {
    } finally {
      setLoadingMore(false);
    }
  };
  const clearFilters = () => {
    setQuery("");
    setCountry("");
    setGenres([]);
    setLanguages([]);
  };
  const toggleGenre = (g) => setGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  const toggleLanguage = (l) => setLanguages((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]);
  return /* @__PURE__ */ jsxs("div", { ref: scrollContainerRef, onScroll: handleScroll, className: "flex-1 overflow-y-auto px-4 lg:px-8 pb-32", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl lg:text-3xl font-heading font-bold mt-6 mb-4 bg-gradient-to-r from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] bg-clip-text text-transparent", children: t("search.title") }),
    /* @__PURE__ */ jsxs("div", { className: "relative mb-4", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          value: query,
          onChange: (e) => setQuery(e.target.value),
          placeholder: t("search.placeholder"),
          className: "pl-10 pr-9 bg-accent border-0 text-white placeholder:text-muted-foreground focus:ring-primary"
        }
      ),
      query && /* @__PURE__ */ jsx("button", { onClick: () => setQuery(""), className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-3", children: [
      /* @__PURE__ */ jsx(
        CountryDropdown,
        {
          countries: countryList,
          value: country,
          onChange: setCountry,
          placeholder: t("search.selectCountry")
        }
      ),
      country && /* @__PURE__ */ jsxs("button", { onClick: () => setCountry(""), className: "mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground", children: [
        /* @__PURE__ */ jsx(X, { className: "w-3 h-3" }),
        " ",
        t("search.clearCountry")
      ] }),
      usingFallbackCountries && !isCountriesError && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mt-1 px-1", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3 h-3 text-muted-foreground shrink-0" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: reducedCountryListLabel === "search.reducedCountryList" ? "Liste de pays réduite (temporaire)" : reducedCountryListLabel }),
        /* @__PURE__ */ jsx("button", { onClick: () => retryCountries(), className: "text-xs text-primary hover:underline font-medium ml-1", children: t("search.retry") })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-3 mb-3", children: [
      /* @__PURE__ */ jsx(
        MultiSelectDropdown,
        {
          label: t("search.genre"),
          items: GENRES,
          selected: genres,
          onToggle: toggleGenre,
          searchable: true
        }
      ),
      /* @__PURE__ */ jsx(
        MultiSelectDropdown,
        {
          label: t("search.language"),
          items: LANGUAGES,
          selected: languages,
          onToggle: toggleLanguage,
          searchable: true
        }
      )
    ] }),
    (genres.length > 0 || languages.length > 0) && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5 mb-3", children: [
      genres.map((g) => /* @__PURE__ */ jsxs(Badge, { className: "bg-[hsl(225,90%,58%)] text-white capitalize cursor-pointer gap-1 hover:bg-[hsl(225,90%,50%)]", onClick: () => toggleGenre(g), children: [
        g,
        " ",
        /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
      ] }, g)),
      languages.map((l) => /* @__PURE__ */ jsxs(Badge, { className: "bg-[hsl(280,80%,60%)] text-white capitalize cursor-pointer gap-1 hover:bg-[hsl(280,80%,50%)]", onClick: () => toggleLanguage(l), children: [
        l,
        " ",
        /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
      ] }, l))
    ] }),
    hasFilters && /* @__PURE__ */ jsxs("button", { onClick: clearFilters, className: "flex items-center gap-1 text-xs text-muted-foreground mb-4 hover:text-foreground", children: [
      /* @__PURE__ */ jsx(X, { className: "w-3 h-3" }),
      " ",
      t("search.resetFilters")
    ] }),
    !isLoading && allResults.length > 0 && /* @__PURE__ */ jsx("div", { className: "mb-3 p-3 rounded-lg bg-accent/40 border border-border/50 text-xs text-muted-foreground leading-relaxed", children: /* @__PURE__ */ jsxs("p", { children: [
      /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: t("search.notFoundTitle") }),
      " ",
      t("search.notFoundAddOn"),
      " ",
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "https://www.radio-browser.info/add",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-primary hover:underline font-medium",
          children: "Radio Browser"
        }
      ),
      ". ",
      t("search.notFoundEmailUs"),
      " ",
      /* @__PURE__ */ jsx(
        "a",
        {
          href: `mailto:info@radiosphere.be?subject=${encodeURIComponent(t("search.addStationSubject"))}`,
          className: "text-primary hover:underline font-medium",
          children: "info@radiosphere.be"
        }
      ),
      "."
    ] }) }),
    !isLoading && allResults.length > 0 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mb-3", children: [
      hasMore ? `${allResults.length}+` : allResults.length,
      " ",
      t("search.resultsCount")
    ] }),
    isLoading && /* @__PURE__ */ jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-primary" }) }),
    isSearchError && !isLoading && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3 py-12", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive text-center", children: t("search.networkError") }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => retrySearch(),
          className: "px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors",
          children: t("search.retry")
        }
      )
    ] }),
    isCountriesError && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3 px-2", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: t("search.countriesError") }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => retryCountries(),
          className: "text-xs text-primary hover:underline font-medium",
          children: t("search.retry")
        }
      )
    ] }),
    allResults.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mb-2 flex-wrap", children: [
        /* @__PURE__ */ jsx(ArrowUpDown, { className: "w-3.5 h-3.5 text-muted-foreground" }),
        ["votes", "name", "clickcount"].map((key) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setSortBy(key),
            className: cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
              sortBy === key ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground"
            ),
            children: t(key === "votes" ? "search.sortPopularity" : key === "name" ? "search.sortAZ" : "search.sortClicks")
          },
          key
        )),
        /* @__PURE__ */ jsx("div", { className: "w-px h-5 bg-border mx-1" }),
        [
          { mode: "small", icon: Grip },
          { mode: "list", icon: List },
          { mode: "medium", icon: Grid3x3 },
          { mode: "large", icon: LayoutGrid }
        ].map(({ mode, icon: Icon }) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => updateViewMode(mode),
            className: cn(
              "p-1.5 rounded-md transition-all",
              viewMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
            ),
            children: /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4" })
          },
          mode
        ))
      ] }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: cn(
            "animate-fade-in",
            viewMode === "small" ? "grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-9 gap-1.5" : viewMode === "medium" ? "grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2" : viewMode === "large" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" : "space-y-1"
          ),
          children: allResults.map((s) => /* @__PURE__ */ jsx(StationCard, { station: s, viewMode, isFavorite: isFavorite(s.id), onToggleFavorite }, s.id))
        },
        viewMode
      ),
      hasMore && /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: loadMore,
          disabled: loadingMore,
          className: "w-full py-3 mt-2 rounded-lg bg-accent text-sm text-foreground font-medium hover:bg-accent/80 transition-colors flex items-center justify-center gap-2",
          children: [
            loadingMore ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : null,
            loadingMore ? t("search.loadingMore") || "Chargement..." : t("search.loadMore") || "Plus de stations"
          ]
        }
      )
    ] }),
    results && allResults.length === 0 && !isLoading && !isSearchError && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center py-12", children: t("search.noResults") }),
    !hasFilters && !isSearchError && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center py-12", children: t("search.useFilters") }),
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
function MultiSelectDropdown({ label, items, selected, onToggle, searchable }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const checkScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 4);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(checkScroll, 50);
    return () => clearTimeout(timer);
  }, [open, checkScroll, search]);
  const filtered = search ? items.filter((i) => i.toLowerCase().includes(search.toLowerCase())) : items;
  const handleCustomTag = () => {
    const tag = search.trim().toLowerCase();
    if (tag && !selected.includes(tag)) {
      onToggle(tag);
    }
    setSearch("");
  };
  return /* @__PURE__ */ jsxs("div", { className: "relative flex-1", ref, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setOpen((o) => !o),
        className: "w-full flex items-center justify-between gap-2 bg-accent rounded-lg px-3 py-2.5 text-sm text-foreground",
        children: [
          /* @__PURE__ */ jsx("span", { className: "truncate", children: selected.length ? `${label} (${selected.length})` : label }),
          /* @__PURE__ */ jsx(ChevronDown, { className: cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180") })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxs("div", { className: "absolute z-50 mt-1 w-full rounded-lg bg-popover border border-border shadow-xl max-h-[280px] flex flex-col overflow-hidden", children: [
      searchable && /* @__PURE__ */ jsx("div", { className: "px-2 pb-1 pt-1 bg-popover z-10 border-b border-border shrink-0", children: /* @__PURE__ */ jsx(
        Input,
        {
          ref: inputRef,
          value: search,
          onChange: (e) => setSearch(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter" && filtered.length === 0 && search.trim()) handleCustomTag();
          },
          placeholder: "Rechercher...",
          className: "h-8 text-xs bg-accent border-0"
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-h-0", children: [
        canScrollUp && /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 right-0 z-10 flex justify-center pointer-events-none", children: /* @__PURE__ */ jsx(ChevronUp, { className: "w-4 h-4 text-muted-foreground animate-pulse" }) }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            ref: listRef,
            className: "overflow-y-auto py-1 max-h-[220px]",
            onScroll: checkScroll,
            children: [
              filtered.map((item) => /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => onToggle(item),
                  className: "w-full flex items-center gap-2 px-3 py-2 text-sm capitalize hover:bg-accent transition-colors text-foreground",
                  children: [
                    /* @__PURE__ */ jsx("div", { className: cn(
                      "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                      selected.includes(item) ? "bg-primary border-primary" : "border-muted-foreground/40"
                    ), children: selected.includes(item) && /* @__PURE__ */ jsx(Check, { className: "w-3 h-3 text-primary-foreground" }) }),
                    item
                  ]
                },
                item
              )),
              searchable && filtered.length === 0 && search.trim() && /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleCustomTag,
                  className: "w-full px-3 py-2 text-sm text-primary hover:bg-accent transition-colors text-left",
                  children: [
                    "+ Ajouter « ",
                    search.trim(),
                    " »"
                  ]
                }
              )
            ]
          }
        ),
        canScrollDown && /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 right-0 z-10 flex justify-center pointer-events-none", children: /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 text-muted-foreground animate-pulse" }) })
      ] })
    ] })
  ] });
}
function CountryDropdown({ countries, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const checkScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 4);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(checkScroll, 50);
    return () => clearTimeout(timer);
  }, [open, checkScroll, search]);
  const filtered = search ? countries.filter((c) => c.label.toLowerCase().includes(search.toLowerCase())) : countries;
  const selectedCountry = countries.find((c) => c.value === value);
  return /* @__PURE__ */ jsxs("div", { className: "relative", ref, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setOpen((o) => !o),
        className: "w-full flex items-center justify-between gap-2 bg-accent rounded-lg px-3 py-2.5 text-sm text-foreground",
        children: [
          /* @__PURE__ */ jsxs("span", { className: "truncate inline-flex items-center gap-2", children: [
            (selectedCountry == null ? void 0 : selectedCountry.flagUrl) ? /* @__PURE__ */ jsx("img", { src: selectedCountry.flagUrl, alt: selectedCountry.label, className: "w-4 h-4 rounded-full object-cover", loading: "lazy" }) : (selectedCountry == null ? void 0 : selectedCountry.code) ? /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold text-muted-foreground uppercase w-4 text-center", children: selectedCountry.code }) : null,
            (selectedCountry == null ? void 0 : selectedCountry.label) || placeholder
          ] }),
          /* @__PURE__ */ jsx(ChevronDown, { className: cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180") })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxs("div", { className: "absolute z-[100] mt-1 w-full rounded-lg bg-popover border border-border shadow-xl max-h-[280px] flex flex-col", children: [
      /* @__PURE__ */ jsx("div", { className: "px-2 pb-1 pt-1 bg-popover z-10 border-b border-border rounded-t-lg shrink-0", children: /* @__PURE__ */ jsx(
        Input,
        {
          ref: inputRef,
          value: search,
          onChange: (e) => setSearch(e.target.value),
          placeholder: "🔍",
          className: "h-8 text-xs bg-accent border-0"
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-h-0", children: [
        canScrollUp && /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 right-0 z-10 flex justify-center pointer-events-none", children: /* @__PURE__ */ jsx(ChevronUp, { className: "w-4 h-4 text-muted-foreground animate-pulse" }) }),
        /* @__PURE__ */ jsx(
          "div",
          {
            ref: listRef,
            className: "overflow-y-auto py-1 max-h-[220px]",
            onScroll: checkScroll,
            children: filtered.map((c) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  onChange(c.value);
                  setOpen(false);
                  setSearch("");
                },
                className: "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground text-left",
                children: [
                  value === c.value && /* @__PURE__ */ jsx(Check, { className: "w-4 h-4 text-primary shrink-0" }),
                  value !== c.value && /* @__PURE__ */ jsx("div", { className: "w-4 h-4 shrink-0" }),
                  c.flagUrl ? /* @__PURE__ */ jsx("img", { src: c.flagUrl, alt: c.label, className: "w-4 h-4 rounded-full object-cover shrink-0", loading: "lazy" }) : c.code ? /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold text-muted-foreground uppercase w-4 text-center shrink-0", children: c.code }) : null,
                  /* @__PURE__ */ jsx("span", { className: "truncate", children: c.label })
                ]
              },
              c.value
            ))
          }
        ),
        canScrollDown && /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 right-0 z-10 flex justify-center pointer-events-none", children: /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 text-muted-foreground animate-pulse" }) })
      ] })
    ] })
  ] });
}
export {
  SearchPage
};

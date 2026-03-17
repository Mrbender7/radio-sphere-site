import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { radioBrowserProvider, getCountries, CountryInfo } from "@/services/RadioService";
import { StationCard, StationViewMode } from "@/components/StationCard";
import { RadioStation } from "@/types/radio";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, X, ChevronDown, ChevronUp, Check, ArrowUpDown, ArrowUp, AlertTriangle, List, Grid3x3, LayoutGrid, Grip } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

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
  { label: "USA", value: "The United States Of America", code: "us" },
];

function buildFlagUrl(code?: string): string | null {
  if (!code || code.length !== 2) return null;
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

const GENRES = ["60s", "70s", "80s", "90s", "ambient", "blues", "chillout", "classical", "country", "electronic", "funk", "hiphop", "jazz", "latin", "metal", "news", "pop", "r&b", "reggae", "rock", "soul", "techno", "trance", "world"];
const LANGUAGES = ["arabic", "english", "french", "german", "japanese", "portuguese", "spanish"];

/** Map Japanese search terms to their English genre equivalents */
const JAPANESE_GENRE_MAP: Record<string, string> = {
  "ジャズ": "jazz", "ロック": "rock", "ポップ": "pop", "ポップス": "pop",
  "クラシック": "classical", "テクノ": "techno", "トランス": "trance",
  "ブルース": "blues", "ソウル": "soul", "ファンク": "funk",
  "メタル": "metal", "レゲエ": "reggae", "ヒップホップ": "hiphop",
  "エレクトロニック": "electronic", "アンビエント": "ambient",
  "カントリー": "country", "ラテン": "latin", "ニュース": "news",
  "チルアウト": "chillout", "ワールド": "world",
};

/** Resolve Japanese query to English genre tag if applicable */
function resolveJapaneseQuery(q: string): { query: string; extraTag?: string } {
  const trimmed = q.trim();
  const mapped = JAPANESE_GENRE_MAP[trimmed];
  if (mapped) return { query: trimmed, extraTag: mapped };
  return { query: trimmed };
}

/** Merge fulfilled results from Promise.allSettled, ignoring failures */
function mergeSettled<T>(results: PromiseSettledResult<T[]>[]): T[] {
  const merged: T[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") merged.push(...r.value);
  }
  return merged;
}

/** Dedupe stations by id into a Map, then return sorted array */
function dedupeAndSort(stations: RadioStation[], sortBy: "votes" | "name" | "clickcount"): RadioStation[] {
  const map = new Map<string, RadioStation>();
  for (const s of stations) {
    if (!map.has(s.id)) map.set(s.id, s);
  }
  const arr = Array.from(map.values());
  return sortStations(arr, sortBy);
}

/** Sort stations client-side */
function sortStations(stations: RadioStation[], sortBy: "votes" | "name" | "clickcount"): RadioStation[] {
  return [...stations].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    if (sortBy === "clickcount") return (b.clickcount || 0) - (a.clickcount || 0);
    return (b.votes || 0) - (a.votes || 0);
  });
}

interface SearchPageProps {
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (station: RadioStation) => void;
  initialGenre?: string;
}

export function SearchPage({ isFavorite, onToggleFavorite, initialGenre }: SearchPageProps) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [allResults, setAllResults] = useState<RadioStation[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState<"votes" | "name" | "clickcount">("votes");
  const [viewMode, setViewMode] = useState<StationViewMode>(() => {
    try { const v = localStorage.getItem("radiosphere_view_mode"); if (v) return v as StationViewMode; } catch {}
    return "list";
  });
  const updateViewMode = useCallback((mode: StationViewMode) => {
    setViewMode(mode);
    try { localStorage.setItem("radiosphere_view_mode", mode); } catch {}
  }, []);
  const { t } = useTranslation();
  const PAGE_SIZE = 40;

  // Map special genre aliases to multiple search tags
  const GENRE_TAG_MAP: Record<string, string[]> = {
    mousemusic: ["park", "disney", "disneyland", "children"],
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
    staleTime: 30 * 60 * 1000,
    retry: 0,
  });

  const countryList = useMemo(() => {
    if (!apiCountries || apiCountries.length === 0) {
      return FALLBACK_COUNTRIES.map((c) => ({ ...c, flagUrl: buildFlagUrl(c.code) }));
    }
    return apiCountries.map((c: CountryInfo) => ({
      label: c.name,
      value: c.name,
      code: c.iso_3166_1.toLowerCase(),
      flagUrl: buildFlagUrl(c.iso_3166_1),
    }));
  }, [apiCountries]);

  const usingFallbackCountries = !apiCountries || apiCountries.length === 0;
  const reducedCountryListLabel = t("search.reducedCountryList");

  const hasFilters = !!(query || country || genres.length || languages.length);

  // Reset extra (load-more) results when filters change
  const [extraResults, setExtraResults] = useState<RadioStation[]>([]);
  useEffect(() => {
    setExtraResults([]);
    setOffset(0);
    setHasMore(false);
  }, [query, country, genres, languages, sortBy]);

  const sortReverse = sortBy === "name" ? "false" : "true";

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) setShowScrollTop(el.scrollTop > 300);
  }, []);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { data: results, isLoading, isError: isSearchError, refetch: retrySearch } = useQuery({
    queryKey: ["search", query, country, genres, languages, sortBy],
    queryFn: async ({ signal }) => {
      const resolved = resolveJapaneseQuery(query);
      const searchName = resolved.query;
      const japaneseExtraTag = resolved.extraTag;

      const baseParams = {
        country: country || undefined,
        language: languages.length ? languages.join(",") : undefined,
        limit: PAGE_SIZE,
        offset: 0,
        order: sortBy,
        reverse: sortReverse,
        signal,
      };

      const allStations: RadioStation[] = [];

      // Multi-genre OR: one request per genre, then merge
      if (genres.length > 1) {
        const genreSearches = genres.map(g =>
          searchName
            ? radioBrowserProvider.searchStations({ ...baseParams, tag: g, name: searchName })
            : radioBrowserProvider.searchStations({ ...baseParams, tag: g })
        );
        // Also search by name alone (no tag filter) to catch untagged stations
        if (searchName) {
          genreSearches.push(radioBrowserProvider.searchStations({ ...baseParams, name: searchName }));
        }
        // If Japanese term maps to a genre, also search by that tag
        if (japaneseExtraTag) {
          genreSearches.push(radioBrowserProvider.searchStations({ ...baseParams, tag: japaneseExtraTag }));
        }
        const settled = await Promise.allSettled(genreSearches);
        allStations.push(...mergeSettled(settled));
      } else {
        // Single genre or no genre
        const singleTag = genres.length === 1 ? genres[0] : undefined;

        if (searchName) {
          const searches: Promise<RadioStation[]>[] = [
            radioBrowserProvider.searchStations({ ...baseParams, name: searchName, tag: singleTag }),
          ];
          // Also search by tag=query to find stations tagged with the keyword
          if (singleTag) {
            searches.push(radioBrowserProvider.searchStations({ ...baseParams, name: searchName }));
          } else {
            searches.push(radioBrowserProvider.searchStations({ ...baseParams, tag: searchName }));
          }
          // If Japanese term maps to a genre, also search by that English tag
          if (japaneseExtraTag) {
            searches.push(radioBrowserProvider.searchStations({ ...baseParams, tag: japaneseExtraTag }));
          }
          const settled = await Promise.allSettled(searches);
          allStations.push(...mergeSettled(settled));
          if (allStations.length === 0 && settled.every(r => r.status === "rejected")) {
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
    staleTime: 2 * 60 * 1000,
    retry: 0,
  });

  // Derive allResults from query data + extra loaded pages, always sorted
  useEffect(() => {
    if (results) {
      setOffset(results.length);
      setHasMore(results.length >= PAGE_SIZE);
      if (extraResults.length > 0) {
        const ids = new Set(results.map(s => s.id));
        const combined = [...results, ...extraResults.filter(s => !ids.has(s.id))];
        setAllResults(sortStations(combined, sortBy));
      } else {
        setAllResults(results); // already sorted from query
      }
    } else {
      setAllResults([]);
    }
  }, [results, sortBy]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const baseParams = {
        country: country || undefined,
        language: languages.length ? languages.join(",") : undefined,
        limit: PAGE_SIZE,
        offset,
        order: sortBy,
        reverse: sortReverse,
      };

      const allStations: RadioStation[] = [];

      if (genres.length > 1) {
        const genreSearches = genres.map(g =>
          query
            ? radioBrowserProvider.searchStations({ ...baseParams, tag: g, name: query })
            : radioBrowserProvider.searchStations({ ...baseParams, tag: g })
        );
        if (query) {
          genreSearches.push(radioBrowserProvider.searchStations({ ...baseParams, name: query }));
        }
        const settled = await Promise.allSettled(genreSearches);
        allStations.push(...mergeSettled(settled));
      } else {
        const singleTag = genres.length === 1 ? genres[0] : undefined;

        if (query) {
          const searches: Promise<RadioStation[]>[] = [
            radioBrowserProvider.searchStations({ ...baseParams, name: query, tag: singleTag }),
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
          const data = await radioBrowserProvider.searchStations(baseParams);
          allStations.push(...data);
        }
      }

      // Dedupe new data
      const newMap = new Map<string, RadioStation>();
      for (const s of allStations) if (!newMap.has(s.id)) newMap.set(s.id, s);
      const data = Array.from(newMap.values());

      setExtraResults(prev => {
        const ids = new Set(prev.map(s => s.id));
        return [...prev, ...data.filter(s => !ids.has(s.id))];
      });
      const existingIds = new Set(allResults.map(x => x.id));
      const newAll = sortStations([...allResults, ...data.filter(s => !existingIds.has(s.id))], sortBy);
      setAllResults(newAll);
      setOffset(o => o + data.length);
      setHasMore(data.length >= PAGE_SIZE);
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  };

  const clearFilters = () => { setQuery(""); setCountry(""); setGenres([]); setLanguages([]); };

  const toggleGenre = (g: string) => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  const toggleLanguage = (l: string) => setLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);

  return (
    <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 lg:px-8 pb-32">
      <h1 className="text-2xl lg:text-3xl font-heading font-bold mt-6 mb-4 bg-gradient-to-r from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] bg-clip-text text-transparent">{t("search.title")}</h1>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t("search.placeholder")}
          className="pl-10 pr-9 bg-accent border-0 text-white placeholder:text-muted-foreground focus:ring-primary"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mb-3">
        <CountryDropdown
          countries={countryList}
          value={country}
          onChange={setCountry}
          placeholder={t("search.selectCountry")}
        />
        {country && (
          <button onClick={() => setCountry("")} className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3" /> {t("search.clearCountry")}
          </button>
        )}
        {usingFallbackCountries && !isCountriesError && (
          <div className="flex items-center gap-1.5 mt-1 px-1">
            <AlertTriangle className="w-3 h-3 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              {reducedCountryListLabel === "search.reducedCountryList"
                ? "Liste de pays réduite (temporaire)"
                : reducedCountryListLabel}
            </p>
            <button onClick={() => retryCountries()} className="text-xs text-primary hover:underline font-medium ml-1">
              {t("search.retry")}
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-3">
        <MultiSelectDropdown
          label={t("search.genre")}
          items={GENRES}
          selected={genres}
          onToggle={toggleGenre}
          searchable
        />
        <MultiSelectDropdown
          label={t("search.language")}
          items={LANGUAGES}
          selected={languages}
          onToggle={toggleLanguage}
          searchable
        />
      </div>

      {(genres.length > 0 || languages.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {genres.map(g => (
            <Badge key={g} className="bg-[hsl(225,90%,58%)] text-white capitalize cursor-pointer gap-1 hover:bg-[hsl(225,90%,50%)]" onClick={() => toggleGenre(g)}>
              {g} <X className="w-3 h-3" />
            </Badge>
          ))}
          {languages.map(l => (
            <Badge key={l} className="bg-[hsl(280,80%,60%)] text-white capitalize cursor-pointer gap-1 hover:bg-[hsl(280,80%,50%)]" onClick={() => toggleLanguage(l)}>
              {l} <X className="w-3 h-3" />
            </Badge>
          ))}
        </div>
      )}

      {hasFilters && (
        <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground mb-4 hover:text-foreground">
          <X className="w-3 h-3" /> {t("search.resetFilters")}
        </button>
      )}

      {!isLoading && allResults.length > 0 && (
        <p className="text-xs text-muted-foreground mb-3">
          {hasMore ? `${allResults.length}+` : allResults.length} {t("search.resultsCount")}
        </p>
      )}

      {isLoading && (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      )}
      {isSearchError && !isLoading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-sm text-destructive text-center">{t("search.networkError")}</p>
          <button
            onClick={() => retrySearch()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {t("search.retry")}
          </button>
        </div>
      )}
      {isCountriesError && (
        <div className="flex items-center gap-2 mb-3 px-2">
          <p className="text-xs text-destructive">{t("search.countriesError")}</p>
          <button
            onClick={() => retryCountries()}
            className="text-xs text-primary hover:underline font-medium"
          >
            {t("search.retry")}
          </button>
        </div>
      )}
      {allResults.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            {(["votes", "name", "clickcount"] as const).map(key => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  sortBy === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-muted-foreground hover:text-foreground"
                )}
              >
                {t(key === "votes" ? "search.sortPopularity" : key === "name" ? "search.sortAZ" : "search.sortClicks")}
              </button>
            ))}

            <div className="w-px h-5 bg-border mx-1" />

            {([
              { mode: "small" as StationViewMode, icon: Grip },
              { mode: "list" as StationViewMode, icon: List },
              { mode: "medium" as StationViewMode, icon: Grid3x3 },
              { mode: "large" as StationViewMode, icon: LayoutGrid },
            ]).map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <div
            key={viewMode}
            className={cn(
              "animate-fade-in",
              viewMode === "small"
                ? "grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-9 gap-1.5"
                : viewMode === "medium"
                  ? "grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2"
                  : viewMode === "large"
                    ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
                    : "space-y-1"
            )}
          >
            {allResults.map(s => (
              <StationCard key={s.id} station={s} viewMode={viewMode} isFavorite={isFavorite(s.id)} onToggleFavorite={onToggleFavorite} />
            ))}
          </div>
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-3 mt-2 rounded-lg bg-accent text-sm text-foreground font-medium hover:bg-accent/80 transition-colors flex items-center justify-center gap-2"
            >
              {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loadingMore ? t("search.loadingMore") || "Chargement..." : t("search.loadMore") || "Plus de stations"}
            </button>
          )}
        </div>
      )}
      {results && allResults.length === 0 && !isLoading && !isSearchError && (
        <p className="text-sm text-muted-foreground text-center py-12">{t("search.noResults")}</p>
      )}

      {!hasFilters && !isSearchError && (
        <p className="text-sm text-muted-foreground text-center py-12">{t("search.useFilters")}</p>
      )}

      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-48 right-4 z-50 w-10 h-10 rounded-full bg-primary/70 backdrop-blur-sm text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-300",
          showScrollTop ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}

function MultiSelectDropdown({ label, items, selected, onToggle, searchable }: { label: string; items: string[]; selected: string[]; onToggle: (v: string) => void; searchable?: boolean }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(""); }
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

  const filtered = search
    ? items.filter(i => i.toLowerCase().includes(search.toLowerCase()))
    : items;

  const handleCustomTag = () => {
    const tag = search.trim().toLowerCase();
    if (tag && !selected.includes(tag)) {
      onToggle(tag);
    }
    setSearch("");
  };

  return (
    <div className="relative flex-1" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 bg-accent rounded-lg px-3 py-2.5 text-sm text-foreground"
      >
        <span className="truncate">
          {selected.length ? `${label} (${selected.length})` : label}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg bg-popover border border-border shadow-xl max-h-[280px] flex flex-col overflow-hidden">
          {searchable && (
            <div className="px-2 pb-1 pt-1 bg-popover z-10 border-b border-border shrink-0">
              <Input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && filtered.length === 0 && search.trim()) handleCustomTag(); }}
                placeholder="Rechercher..."
                className="h-8 text-xs bg-accent border-0"
              />
            </div>
          )}
          <div className="relative flex-1 min-h-0">
            {canScrollUp && (
              <div className="absolute top-0 left-0 right-0 z-10 flex justify-center pointer-events-none">
                <ChevronUp className="w-4 h-4 text-muted-foreground animate-pulse" />
              </div>
            )}
            <div
              ref={listRef}
              className="overflow-y-auto py-1 max-h-[220px]"
              onScroll={checkScroll}
            >
              {filtered.map(item => (
                <button
                  key={item}
                  onClick={() => onToggle(item)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm capitalize hover:bg-accent transition-colors text-foreground"
                >
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                    selected.includes(item) ? "bg-primary border-primary" : "border-muted-foreground/40"
                  )}>
                    {selected.includes(item) && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  {item}
                </button>
              ))}
              {searchable && filtered.length === 0 && search.trim() && (
                <button
                  onClick={handleCustomTag}
                  className="w-full px-3 py-2 text-sm text-primary hover:bg-accent transition-colors text-left"
                >
                  + Ajouter « {search.trim()} »
                </button>
              )}
            </div>
            {canScrollDown && (
              <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center pointer-events-none">
                <ChevronDown className="w-4 h-4 text-muted-foreground animate-pulse" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CountryDropdown({ countries, value, onChange, placeholder }: { countries: { label: string; value: string; code?: string; flagUrl?: string | null }[]; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(""); }
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

  const filtered = search
    ? countries.filter(c => c.label.toLowerCase().includes(search.toLowerCase()))
    : countries;

  const selectedCountry = countries.find(c => c.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 bg-accent rounded-lg px-3 py-2.5 text-sm text-foreground"
      >
        <span className="truncate inline-flex items-center gap-2">
          {selectedCountry?.flagUrl ? (
            <img src={selectedCountry.flagUrl} alt={selectedCountry.label} className="w-4 h-4 rounded-full object-cover" loading="lazy" />
          ) : selectedCountry?.code ? (
            <span className="text-[10px] font-semibold text-muted-foreground uppercase w-4 text-center">{selectedCountry.code}</span>
          ) : null}
          {selectedCountry?.label || placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-[100] mt-1 w-full rounded-lg bg-popover border border-border shadow-xl max-h-[280px] flex flex-col">
          <div className="px-2 pb-1 pt-1 bg-popover z-10 border-b border-border rounded-t-lg shrink-0">
            <Input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍"
              className="h-8 text-xs bg-accent border-0"
            />
          </div>
          <div className="relative flex-1 min-h-0">
            {canScrollUp && (
              <div className="absolute top-0 left-0 right-0 z-10 flex justify-center pointer-events-none">
                <ChevronUp className="w-4 h-4 text-muted-foreground animate-pulse" />
              </div>
            )}
            <div
              ref={listRef}
              className="overflow-y-auto py-1 max-h-[220px]"
              onScroll={checkScroll}
            >
              {filtered.map(c => (
                <button
                  key={c.value}
                  onClick={() => { onChange(c.value); setOpen(false); setSearch(""); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground text-left"
                >
                  {value === c.value && <Check className="w-4 h-4 text-primary shrink-0" />}
                  {value !== c.value && <div className="w-4 h-4 shrink-0" />}
                  {c.flagUrl ? (
                    <img src={c.flagUrl} alt={c.label} className="w-4 h-4 rounded-full object-cover shrink-0" loading="lazy" />
                  ) : c.code ? (
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase w-4 text-center shrink-0">{c.code}</span>
                  ) : null}
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
            {canScrollDown && (
              <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center pointer-events-none">
                <ChevronDown className="w-4 h-4 text-muted-foreground animate-pulse" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

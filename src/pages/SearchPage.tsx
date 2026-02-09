import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { radioBrowserProvider } from "@/services/RadioService";
import { StationCard } from "@/components/StationCard";
import { RadioStation } from "@/types/radio";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const COUNTRIES = ["France", "United States", "Germany", "United Kingdom", "Spain", "Brazil", "Japan"];
const GENRES = ["pop", "rock", "jazz", "classical", "electronic", "news", "ambient", "hiphop"];
const LANGUAGES = ["french", "english", "spanish", "german", "portuguese", "arabic", "japanese"];

interface SearchPageProps {
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (station: RadioStation) => void;
}

export function SearchPage({ isFavorite, onToggleFavorite }: SearchPageProps) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");

  const hasFilters = !!(query || country || genre || language);

  const { data: results, isLoading } = useQuery({
    queryKey: ["search", query, country, genre, language],
    queryFn: () => radioBrowserProvider.searchStations({
      name: query || undefined,
      country: country || undefined,
      tag: genre || undefined,
      language: language || undefined,
      limit: 40,
    }),
    enabled: hasFilters,
    staleTime: 2 * 60 * 1000,
  });

  const clearFilters = () => { setQuery(""); setCountry(""); setGenre(""); setLanguage(""); };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <h1 className="text-2xl font-bold mt-6 mb-4">Recherche</h1>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher une station..."
          className="pl-10 bg-accent border-0 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Filter sections */}
      <FilterSection label="Pays" items={COUNTRIES} selected={country} onSelect={v => setCountry(v === country ? "" : v)} />
      <FilterSection label="Genre" items={GENRES} selected={genre} onSelect={v => setGenre(v === genre ? "" : v)} />
      <FilterSection label="Langue" items={LANGUAGES} selected={language} onSelect={v => setLanguage(v === language ? "" : v)} />

      {hasFilters && (
        <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
          <X className="w-3 h-3" /> Réinitialiser les filtres
        </button>
      )}

      {/* Results */}
      {isLoading && (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      )}
      {results && (
        <div className="space-y-1">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Aucun résultat trouvé</p>
          ) : (
            results.map(s => (
              <StationCard key={s.id} station={s} compact isFavorite={isFavorite(s.id)} onToggleFavorite={onToggleFavorite} />
            ))
          )}
        </div>
      )}

      {!hasFilters && (
        <p className="text-sm text-muted-foreground text-center py-12">
          Utilisez la recherche ou les filtres pour trouver des stations
        </p>
      )}
    </div>
  );
}

function FilterSection({ label, items, selected, onSelect }: { label: string; items: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map(item => (
          <Badge
            key={item}
            variant={selected === item ? "default" : "secondary"}
            className={cn("cursor-pointer whitespace-nowrap capitalize transition-colors", selected === item && "bg-primary text-primary-foreground")}
            onClick={() => onSelect(item)}
          >
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

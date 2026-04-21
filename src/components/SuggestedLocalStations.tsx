import { useEffect, useState } from "react";
import { RadioStation } from "@/types/radio";
import { StationCard } from "@/components/StationCard";
import { ScrollableRow } from "@/components/ScrollableRow";
import { useTranslation } from "@/contexts/LanguageContext";
import { radioBrowserProvider } from "@/services/RadioService";
import { fetchWithMirrors } from "@/services/radio/mirrors";
import { MapPin } from "lucide-react";

interface SuggestedLocalStationsProps {
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (station: RadioStation) => void;
}

interface GeoData {
  country?: string; // ISO-3166-1 alpha-2 (e.g. "BE")
  name?: string;
}

const CACHE_KEY = "radiosphere_local_geo";
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

function loadCachedGeo(): GeoData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: GeoData };
    if (Date.now() - parsed.ts > CACHE_TTL) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function saveCachedGeo(data: GeoData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    /* ignore */
  }
}

/** Normalize a raw Radio Browser station object into our RadioStation shape. */
function normalizeRaw(raw: any): RadioStation {
  return {
    id: raw.stationuuid,
    name: raw.name,
    streamUrl: raw.url_resolved || raw.url,
    logo: raw.favicon || "",
    tags: raw.tags ? raw.tags.split(",").filter(Boolean) : [],
    country: raw.country || "",
    countryCode: raw.countrycode || "",
    language: raw.language || "",
    bitrate: raw.bitrate || 0,
    votes: raw.votes || 0,
/** Normalize a raw Radio Browser station object into our RadioStation shape. */
function normalizeRaw(raw: any): RadioStation {
  return {
    id: raw.stationuuid,
    name: raw.name,
    streamUrl: raw.url_resolved || raw.url,
    logo: raw.favicon || "",
    tags: raw.tags ? raw.tags.split(",").filter(Boolean) : [],
    country: raw.country || "",
    countryCode: raw.countrycode || "",
    language: raw.language || "",
    codec: raw.codec || "",
    bitrate: raw.bitrate || 0,
    votes: raw.votes || 0,
    clickcount: raw.clickcount || 0,
    homepage: raw.homepage || "",
  };
}
    homepage: raw.homepage || "",
  };
}

export function SuggestedLocalStations({ isFavorite, onToggleFavorite }: SuggestedLocalStationsProps) {
  const { t } = useTranslation();
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [countryName, setCountryName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        let geo = loadCachedGeo();
        if (!geo?.country) {
          const res = await fetch("https://get.geojs.io/v1/ip/country.json");
          if (!res.ok) throw new Error("geo failed");
          geo = (await res.json()) as GeoData;
          if (geo?.country) saveCachedGeo(geo);
        }
        if (!geo?.country) {
          if (!cancelled) setLoading(false);
          return;
        }
        const code = geo.country.toUpperCase();
        if (!cancelled) setCountryName(geo.name || code);

        // STRICT country filter via bycountrycodeexact + clickcount ordering.
        // This is the correct endpoint — `searchStations` with no filter would
        // return worldwide popular stations (BBC, SWR3...) which is exactly
        // what we want to avoid here.
        let result: RadioStation[] = [];
        try {
          const raw = await fetchWithMirrors(
            `stations/bycountrycodeexact/${encodeURIComponent(code)}`,
            { limit: "10", order: "clickcount", reverse: "true", hidebroken: "true" },
          );
          result = raw.map(normalizeRaw).filter((s) => s.streamUrl && s.name);
        } catch (apiErr) {
          // Fallback: provider with country name + client-side filter on code,
          // so users still see local stations if all mirrors are down.
          console.warn("[SuggestedLocalStations] API failed, falling back", apiErr);
          if (geo.name) {
            const data = await radioBrowserProvider.getStationsByCountry(geo.name, 30);
            result = data.filter((s) => s.countryCode?.toUpperCase() === code).slice(0, 10);
          }
        }

        if (!cancelled) setStations(result);
      } catch (e) {
        console.warn("[SuggestedLocalStations] failed", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="mb-3">
        <div className="h-6 w-56 bg-muted rounded mb-2 animate-pulse" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-28 h-28 rounded-xl bg-muted animate-pulse flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (stations.length === 0) return null;

  return (
    <section className="mb-3">
      <h2 className="text-lg font-heading font-semibold mb-2 bg-gradient-to-r from-[hsl(220,90%,60%)] to-[hsl(280,80%,60%)] bg-clip-text text-transparent flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[hsl(220,90%,60%)]" />
        {t("home.popularNearYou")}
        {countryName && (
          <span className="text-xs font-normal text-muted-foreground">({countryName})</span>
        )}
      </h2>
      <ScrollableRow>
        {stations.map((s) => (
          <StationCard
            key={s.id}
            station={s}
            isFavorite={isFavorite(s.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </ScrollableRow>
    </section>
  );
}

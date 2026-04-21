import { useEffect, useState } from "react";
import { RadioStation } from "@/types/radio";
import { StationCard } from "@/components/StationCard";
import { ScrollableRow } from "@/components/ScrollableRow";
import { useTranslation } from "@/contexts/LanguageContext";
import { radioBrowserProvider } from "@/services/RadioService";
import { MapPin } from "lucide-react";

interface SuggestedLocalStationsProps {
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (station: RadioStation) => void;
}

interface GeoData {
  country?: string;
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
        if (!cancelled) setCountryName(geo.name || geo.country);

        // Use existing provider — handles mirrors + fallback gracefully
        const data = await radioBrowserProvider.searchStations({
          limit: 10,
          order: "clickcount",
          reverse: "true",
        } as any);
        // Filter by country code client-side as safety net
        const filtered = (
          await radioBrowserProvider.searchStations({
            limit: 30,
            order: "clickcount",
            reverse: "true",
          } as any)
        ).filter((s) => s.countryCode?.toUpperCase() === geo!.country!.toUpperCase());

        const result = (filtered.length >= 5 ? filtered : data).slice(0, 10);
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

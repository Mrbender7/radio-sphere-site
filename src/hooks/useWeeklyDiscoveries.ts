import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { RadioStation } from "@/types/radio";
import { radioBrowserProvider } from "@/services/RadioService";

const DISCOVERIES_KEY = "radioshere_weekly_discoveries";
const DISCOVERIES_HISTORY_KEY = "radioshere_discoveries_history";

function getMondayKey(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

interface StoredDiscoveries {
  weekKey: string;
  stations: RadioStation[];
}

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISCOVERIES_HISTORY_KEY) || "[]");
  } catch { return []; }
}

function saveHistory(ids: string[]) {
  localStorage.setItem(DISCOVERIES_HISTORY_KEY, JSON.stringify(ids.slice(0, 10)));
}

function loadCached(): StoredDiscoveries | null {
  try {
    const raw = localStorage.getItem(DISCOVERIES_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function analyzeFavorites(favorites: RadioStation[]): { tags: string[]; countries: string[] } {
  const tagCount: Record<string, number> = {};
  const countryCount: Record<string, number> = {};

  for (const s of favorites) {
    for (const tag of s.tags) {
      const t = tag.toLowerCase();
      if (t) tagCount[t] = (tagCount[t] || 0) + 1;
    }
    if (s.country) countryCount[s.country] = (countryCount[s.country] || 0) + 1;
  }

  const tags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
  const countries = Object.entries(countryCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);

  return { tags, countries };
}

export function useWeeklyDiscoveries(favorites: RadioStation[]) {
  const weekKey = useMemo(getMondayKey, []);
  const cached = useMemo(loadCached, []);
  const profile = useMemo(() => analyzeFavorites(favorites), [favorites]);

  const needsFetch = !cached || cached.weekKey !== weekKey;

  const { data } = useQuery({
    queryKey: ["weeklyDiscoveries", weekKey, profile.tags.join(","), profile.countries.join(",")],
    queryFn: async (): Promise<RadioStation[]> => {
      if (favorites.length === 0) {
        // Fallback: random popular stations
        const stations = await radioBrowserProvider.getTopStations(20);
        return pickThree(stations, []);
      }

      const history = loadHistory();
      const favoriteIds = new Set(favorites.map(f => f.id));
      const exclude = new Set([...history, ...favoriteIds]);

      // Search by top tags and countries
      const searches: Promise<RadioStation[]>[] = [];
      for (const tag of profile.tags.slice(0, 3)) {
        searches.push(radioBrowserProvider.searchStations({ tag, limit: 15 }));
      }
      for (const country of profile.countries.slice(0, 2)) {
        searches.push(radioBrowserProvider.searchStations({ country, limit: 15 }));
      }

      const results = await Promise.all(searches);
      const all = results.flat();

      // Dedupe and exclude favorites + history
      const seen = new Set<string>();
      const candidates = all.filter(s => {
        if (!s.id || seen.has(s.id) || exclude.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });

      return pickThree(candidates, Array.from(exclude));
    },
    enabled: needsFetch && favorites.length > 0,
    staleTime: Infinity,
  });

  const [discoveries, setDiscoveries] = useState<RadioStation[]>(cached?.weekKey === weekKey ? cached.stations : []);

  useEffect(() => {
    if (data && data.length > 0) {
      setDiscoveries(data);
      localStorage.setItem(DISCOVERIES_KEY, JSON.stringify({ weekKey, stations: data }));
      // Update history
      const history = loadHistory();
      const newIds = data.map(s => s.id);
      saveHistory([...newIds, ...history]);
    }
  }, [data, weekKey]);

  return discoveries;
}

function pickThree(candidates: RadioStation[], _exclude: string[]): RadioStation[] {
  // Shuffle and pick 3
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

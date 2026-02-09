import { RadioStation, RadioProvider, SearchParams } from "@/types/radio";

const MIRRORS = [
  "https://de1.api.radio-browser.info",
  "https://fr1.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
];

function normalizeStation(raw: any): RadioStation {
  return {
    id: raw.stationuuid || raw.id || "",
    name: raw.name || "Unknown",
    streamUrl: raw.url_resolved || raw.url || "",
    logo: raw.favicon || "",
    country: raw.country || "",
    countryCode: raw.countrycode || "",
    tags: raw.tags ? raw.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
    language: raw.language || "",
    codec: raw.codec || "",
    bitrate: raw.bitrate || 0,
    votes: raw.votes || 0,
  };
}

async function fetchWithMirrors(path: string, params?: Record<string, string>): Promise<any[]> {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  
  for (const mirror of MIRRORS) {
    try {
      const res = await fetch(`${mirror}/json/${path}${query}`, {
        headers: { "User-Agent": "RadioFlow/1.0" },
      });
      if (!res.ok) continue;
      return await res.json();
    } catch {
      continue;
    }
  }
  throw new Error("All Radio Browser mirrors failed");
}

export const radioBrowserProvider: RadioProvider = {
  async searchStations(params: SearchParams): Promise<RadioStation[]> {
    const query: Record<string, string> = {
      limit: String(params.limit || 30),
      offset: String(params.offset || 0),
      order: "votes",
      reverse: "true",
      hidebroken: "true",
    };
    if (params.name) query.name = params.name;
    if (params.country) query.country = params.country;
    if (params.tag) query.tag = params.tag;
    if (params.language) query.language = params.language;

    const data = await fetchWithMirrors("stations/search", query);
    return data.map(normalizeStation);
  },

  async getTopStations(limit = 20): Promise<RadioStation[]> {
    const data = await fetchWithMirrors("stations/topvote", { limit: String(limit), hidebroken: "true" });
    return data.map(normalizeStation);
  },

  async getStationsByTag(tag: string, limit = 20): Promise<RadioStation[]> {
    const data = await fetchWithMirrors("stations/bytag/" + encodeURIComponent(tag), { limit: String(limit), order: "votes", reverse: "true", hidebroken: "true" });
    return data.map(normalizeStation);
  },

  async getStationsByCountry(country: string, limit = 20): Promise<RadioStation[]> {
    const data = await fetchWithMirrors("stations/bycountry/" + encodeURIComponent(country), { limit: String(limit), order: "votes", reverse: "true", hidebroken: "true" });
    return data.map(normalizeStation);
  },
};

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFavorites, useRecentStations } from "@/hooks/useFavorites";
import type { RadioStation } from "@/types/radio";

const makeStation = (id: string, name = "Station " + id): RadioStation => ({
  id,
  name,
  streamUrl: `https://stream.example.com/${id}`,
  logo: "",
  country: "France",
  countryCode: "FR",
  tags: ["pop"],
  language: "fr",
  codec: "mp3",
  bitrate: 128,
  votes: 10,
  clickcount: 100,
  homepage: "",
});

beforeEach(() => {
  localStorage.clear();
});

describe("useFavorites", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toHaveLength(0);
  });

  it("toggles a favorite on and off", () => {
    const { result } = renderHook(() => useFavorites());
    const station = makeStation("1");

    act(() => result.current.toggleFavorite(station));
    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.isFavorite("1")).toBe(true);

    act(() => result.current.toggleFavorite(station));
    expect(result.current.favorites).toHaveLength(0);
    expect(result.current.isFavorite("1")).toBe(false);
  });

  it("persists to localStorage", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggleFavorite(makeStation("1")));

    const stored = JSON.parse(localStorage.getItem("radioflow_favorites") || "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe("1");
  });

  it("sorts favorites alphabetically", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.toggleFavorite(makeStation("2", "Zebra FM"));
      result.current.toggleFavorite(makeStation("1", "Alpha Radio"));
    });
    expect(result.current.favorites[0].name).toBe("Alpha Radio");
    expect(result.current.favorites[1].name).toBe("Zebra FM");
  });

  it("importFavorites merges without duplicates", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggleFavorite(makeStation("1")));

    let added: number;
    act(() => {
      added = result.current.importFavorites([makeStation("1"), makeStation("2")]);
    });
    expect(added!).toBe(1);
    expect(result.current.favorites).toHaveLength(2);
  });
});

describe("useRecentStations", () => {
  it("adds recent and caps at 20", () => {
    const { result } = renderHook(() => useRecentStations());

    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.addRecent(makeStation(String(i)));
      }
    });
    expect(result.current.recent).toHaveLength(20);
    // Most recent should be first
    expect(result.current.recent[0].id).toBe("24");
  });

  it("moves duplicate to front", () => {
    const { result } = renderHook(() => useRecentStations());
    act(() => {
      result.current.addRecent(makeStation("1"));
      result.current.addRecent(makeStation("2"));
      result.current.addRecent(makeStation("1"));
    });
    expect(result.current.recent).toHaveLength(2);
    expect(result.current.recent[0].id).toBe("1");
  });
});

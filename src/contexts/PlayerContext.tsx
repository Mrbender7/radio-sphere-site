import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { RadioStation } from "@/types/radio";
import { toast } from "@/hooks/use-toast";

interface PlayerState {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  volume: number;
  isFullScreen: boolean;
}

interface PlayerContextType extends PlayerState {
  play: (station: RadioStation) => void;
  togglePlay: () => void;
  setVolume: (v: number) => void;
  openFullScreen: () => void;
  closeFullScreen: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be inside PlayerProvider");
  return ctx;
}

export function PlayerProvider({ children, onStationPlay }: { children: React.ReactNode; onStationPlay?: (station: RadioStation) => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isPlayingRef = useRef(false);
  const [state, setState] = useState<PlayerState>({
    currentStation: null,
    isPlaying: false,
    volume: 0.8,
    isFullScreen: false,
  });

  // Keep ref in sync with state
  useEffect(() => {
    isPlayingRef.current = state.isPlaying;
  }, [state.isPlaying]);

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch {
        // WakeLock request failed (e.g. low battery)
      }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = state.volume;
    audioRef.current = audio;

    audio.addEventListener("error", () => {
      setState(s => ({ ...s, isPlaying: false }));
      toast({ title: "Erreur de lecture", description: "Impossible de lire ce flux. Essayez une autre station.", variant: "destructive" });
    });

    // Visibility change handler — resume audio if browser paused it
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlayingRef.current) {
        audio.play().catch(() => {});
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      audio.pause();
      audio.src = "";
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = useCallback((station: RadioStation) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = station.streamUrl;
    audio.play().catch(() => {
      toast({ title: "Erreur", description: "Flux indisponible", variant: "destructive" });
    });
    setState(s => ({ ...s, currentStation: station, isPlaying: true }));
    onStationPlay?.(station);
    requestWakeLock();
    console.log("[RadioSphere] Audio ready");
  }, [onStationPlay, requestWakeLock]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentStation) return;
    if (state.isPlaying) {
      audio.pause();
      releaseWakeLock();
    } else {
      audio.play().catch(() => {});
      requestWakeLock();
    }
    setState(s => ({ ...s, isPlaying: !s.isPlaying }));
  }, [state.isPlaying, state.currentStation, releaseWakeLock, requestWakeLock]);

  const setVolume = useCallback((v: number) => {
    if (audioRef.current) audioRef.current.volume = v;
    setState(s => ({ ...s, volume: v }));
  }, []);

  const openFullScreen = useCallback(() => setState(s => ({ ...s, isFullScreen: true })), []);
  const closeFullScreen = useCallback(() => setState(s => ({ ...s, isFullScreen: false })), []);

  return (
    <PlayerContext.Provider value={{ ...state, play, togglePlay, setVolume, openFullScreen, closeFullScreen }}>
      {children}
    </PlayerContext.Provider>
  );
}

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { globalAudio } from "@/contexts/PlayerContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { toast } from "sonner";

// ... (Interfaces TimestampedChunk et StreamBufferContextType restent identiques)

export function StreamBufferProvider({ children }: { children: React.ReactNode }) {
  const { currentStation, isPlaying } = usePlayer();
  const { t } = useTranslation();

  // Refs (identiques à ton code)
  const chunksRef = useRef<TimestampedChunk[]>([]);
  const totalBytesRef = useRef(0);
  const cumulativeBytesRef = useRef(0);
  const recordingStartIdxRef = useRef(-1);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seekBlobUrlRef = useRef<string | null>(null);
  const stationIdRef = useRef<string | null>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const xhrStreamRef = useRef<XMLHttpRequest | null>(null);
  const noChunkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noChunkRetryRef = useRef(0);
  const bufferAvailableRef = useRef(false);
  const detectedMimeRef = useRef<string>("audio/mpeg");

  // States
  const [bufferSeconds, setBufferSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [bufferAvailable, setBufferAvailable] = useState(false);
  const [recordingAvailable, setRecordingAvailable] = useState(false);
  const [currentSeekOffsetSeconds, setCurrentSeekOffsetSeconds] = useState(0);
  const [debugInfo, setDebugInfo] = useState<{ chunkCount: number; fetchActive: boolean; lastError: string }>({ 
    chunkCount: 0, fetchActive: false, lastError: '' 
  });

  // --- Fonctions utilitaires (clearBuffer, trimBuffer, processChunk, etc.) ---
  // Garde tes fonctions, elles sont très bien écrites.

  const stopFetch = useCallback(() => {
    if (noChunkTimeoutRef.current) {
      clearTimeout(noChunkTimeoutRef.current);
      noChunkTimeoutRef.current = null;
    }
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
      fetchControllerRef.current = null;
    }
    if (xhrStreamRef.current) {
      try { xhrStreamRef.current.abort(); } catch {}
      xhrStreamRef.current = null;
    }
    setDebugInfo(d => ({ ...d, fetchActive: false }));
  }, []);

  // --- LOGIQUE DE FETCH CORRIGÉE ---
  const startFetch = useCallback(async (streamUrl: string) => {
    if (fetchControllerRef.current || xhrStreamRef.current) return; // Évite les doubles connexions

    const controller = new AbortController();
    fetchControllerRef.current = controller;
    
    // Ajout d'un proxy pour le développement si nécessaire (optionnel)
    const fetchUrl = streamUrl; 

    try {
      const response = await fetch(fetchUrl, {
        signal: controller.signal,
        cache: 'no-store',
        mode: 'cors',
      });

      if (!response.ok || !response.body) {
        setDebugInfo(d => ({ ...d, fetchActive: false, lastError: `HTTP ${response.status}` }));
        return;
      }

      const reader = response.body.getReader();
      setDebugInfo(d => ({ ...d, fetchActive: true, lastError: '' }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) processChunk(value);
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setDebugInfo(d => ({ ...d, fetchActive: false, lastError: e?.message }));
      }
    }
  }, [processChunk]);

  // --- GESTION DU CYCLE DE VIE (Le secret est ici) ---
  useEffect(() => {
    const stationId = currentStation?.id ?? null;

    // Si on change de station, on vide TOUT
    if (stationId !== stationIdRef.current) {
      console.log("[StreamBuffer] Station change detected, resetting buffer");
      stopFetch();
      clearBuffer();
      stationIdRef.current = stationId;
      
      if (currentStation?.streamUrl && isPlaying) {
        startFetch(currentStation.streamUrl);
      }
    } 
    // Si on fait juste "Pause", on STOPPE le fetch mais on ne VIDE PAS le buffer !
    else if (!isPlaying && fetchControllerRef.current) {
      console.log("[StreamBuffer] Pause detected, stopping fetch but KEEPING buffer");
      stopFetch();
    }
    // Si on fait "Play" sur la même station, on reprend le fetch
    else if (isPlaying && !fetchControllerRef.current && currentStation?.streamUrl) {
      console.log("[StreamBuffer] Resume detected, restarting fetch");
      startFetch(currentStation.streamUrl);
    }
  }, [currentStation?.id, currentStation?.streamUrl, isPlaying, startFetch, stopFetch, clearBuffer]);

  // Suppression du "Cleanup on unmount" agressif qui tuait le flux pendant la navigation
  useEffect(() => {
    return () => {
      // On ne stoppe rien ici pour que ça survive au changement de page !
      // Le stop se fera uniquement si le Provider est totalement supprimé de l'App
    };
  }, []);

  return (
    <StreamBufferContext.Provider value={{
      bufferSeconds, isRecording, recordingDuration, isLive, canSeekBack,
      bufferAvailable, recordingAvailable, currentSeekOffsetSeconds, debugInfo,
      startRecording, stopRecording, seekBack, returnToLive,
    }}>
      {children}
    </StreamBufferContext.Provider>
  );
}

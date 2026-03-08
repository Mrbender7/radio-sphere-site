import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { globalAudio } from "@/contexts/PlayerContext";

// --- Types ---
interface TimestampedChunk {
  data: Uint8Array;
  timestamp: number;
}

interface StreamBufferContextType {
  bufferSeconds: number;
  isRecording: boolean;
  recordingDuration: number;
  isLive: boolean;
  canSeekBack: boolean;
  bufferAvailable: boolean;
  recordingAvailable: boolean;
  currentSeekOffsetSeconds: number;
  debugInfo: { chunkCount: number; fetchActive: boolean; lastError: string };
  startRecording: () => void;
  stopRecording: () => Promise<{ blob: Blob; fileName: string } | null>;
  seekBack: (seconds: number) => void;
  returnToLive: () => void;
}

const StreamBufferContext = createContext<StreamBufferContextType | null>(null);

export function useStreamBuffer() {
  const ctx = useContext(StreamBufferContext);
  if (!ctx) throw new Error("useStreamBuffer must be inside StreamBufferProvider");
  return ctx;
}

// --- Constants ---
const MAX_BUFFER_SECONDS = 5 * 60; // 5 min circular buffer
const MAX_RECORDING_SECONDS = 10 * 60; // 10 min recording
const BITRATE_ESTIMATE = 16000; // ~128kbps bytes/sec fallback
const MAX_BUFFER_BYTES = MAX_BUFFER_SECONDS * BITRATE_ESTIMATE;

export function StreamBufferProvider({ children }: { children: React.ReactNode }) {
  const { currentStation, isPlaying } = usePlayer();

  // Refs
  const chunksRef = useRef<TimestampedChunk[]>([]);
  const totalBytesRef = useRef(0);
  const cumulativeBytesRef = useRef(0);
  const recordingStartIdxRef = useRef(-1);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seekBlobUrlRef = useRef<string | null>(null);
  const stationIdRef = useRef<string | null>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);
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

  // --- Utility functions ---
  const clearBuffer = useCallback(() => {
    chunksRef.current = [];
    totalBytesRef.current = 0;
    cumulativeBytesRef.current = 0;
    recordingStartIdxRef.current = -1;
    setBufferSeconds(0);
    setBufferAvailable(false);
    setRecordingAvailable(false);
    setIsLive(true);
    setCurrentSeekOffsetSeconds(0);
    setDebugInfo({ chunkCount: 0, fetchActive: false, lastError: '' });
    if (seekBlobUrlRef.current) {
      URL.revokeObjectURL(seekBlobUrlRef.current);
      seekBlobUrlRef.current = null;
    }
  }, []);

  const trimBuffer = useCallback(() => {
    while (totalBytesRef.current > MAX_BUFFER_BYTES && chunksRef.current.length > 1) {
      const removed = chunksRef.current.shift()!;
      totalBytesRef.current -= removed.data.byteLength;
    }
  }, []);

  const processChunk = useCallback((chunk: Uint8Array) => {
    const now = Date.now();
    chunksRef.current.push({ data: chunk, timestamp: now });
    totalBytesRef.current += chunk.byteLength;
    cumulativeBytesRef.current += chunk.byteLength;
    trimBuffer();

    const chunkCount = chunksRef.current.length;
    const estimatedSeconds = totalBytesRef.current / BITRATE_ESTIMATE;
    setBufferSeconds(estimatedSeconds);
    setBufferAvailable(estimatedSeconds > 2);
    setDebugInfo(d => ({ ...d, chunkCount }));
  }, [trimBuffer]);

  // --- Fetch management (simple, original approach) ---
  const stopFetch = useCallback(() => {
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
      fetchControllerRef.current = null;
    }
    setDebugInfo(d => ({ ...d, fetchActive: false }));
  }, []);

  const startFetch = useCallback(async (streamUrl: string) => {
    if (fetchControllerRef.current) return;

    const controller = new AbortController();
    fetchControllerRef.current = controller;

    try {
      console.log("[StreamBuffer] Starting fetch for:", streamUrl.substring(0, 80));
      const response = await fetch(streamUrl, {
        signal: controller.signal,
        cache: 'no-store',
        mode: 'cors',
      });

      if (!response.ok || !response.body) {
        console.warn("[StreamBuffer] Bad response:", response.status);
        setDebugInfo(d => ({ ...d, fetchActive: false, lastError: `HTTP ${response.status}` }));
        fetchControllerRef.current = null;
        return;
      }

      const contentType = response.headers.get('content-type') || 'audio/mpeg';
      detectedMimeRef.current = contentType.split(';')[0].trim();
      console.log("[StreamBuffer] Fetch connected, MIME:", detectedMimeRef.current);

      const reader = response.body.getReader();
      setDebugInfo(d => ({ ...d, fetchActive: true, lastError: '' }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) processChunk(value);
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.warn("[StreamBuffer] Fetch error:", e?.message);
        setDebugInfo(d => ({ ...d, fetchActive: false, lastError: e?.message || 'fetch error' }));
      }
    }
    fetchControllerRef.current = null;
    setDebugInfo(d => ({ ...d, fetchActive: false }));
  }, [processChunk]);

  // --- Lifecycle: react to station changes and play/pause ---
  useEffect(() => {
    const stationId = currentStation?.id ?? null;

    // Station changed → reset everything
    if (stationId !== stationIdRef.current) {
      console.log("[StreamBuffer] Station change detected, resetting buffer");
      stopFetch();
      clearBuffer();
      stationIdRef.current = stationId;

      if (currentStation?.streamUrl && isPlaying) {
        startFetch(currentStation.streamUrl);
      }
    }
    // Pause → stop fetch but KEEP buffer
    else if (!isPlaying && fetchControllerRef.current) {
      console.log("[StreamBuffer] Pause detected, stopping fetch but KEEPING buffer");
      stopFetch();
    }
    // Resume → restart fetch
    else if (isPlaying && !fetchControllerRef.current && currentStation?.streamUrl) {
      console.log("[StreamBuffer] Resume detected, restarting fetch");
      startFetch(currentStation.streamUrl);
    }
  }, [currentStation?.id, currentStation?.streamUrl, isPlaying, startFetch, stopFetch, clearBuffer]);

  // Cleanup only on full unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
        fetchControllerRef.current = null;
      }
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (seekBlobUrlRef.current) URL.revokeObjectURL(seekBlobUrlRef.current);
    };
  }, []);

  // --- Recording ---
  const startRecording = useCallback(() => {
    recordingStartIdxRef.current = chunksRef.current.length;
    setIsRecording(true);
    setRecordingDuration(0);
    setRecordingAvailable(false);

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const start = Date.now();
    recordingTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      setRecordingDuration(elapsed);
      if (elapsed >= MAX_RECORDING_SECONDS) {
        clearInterval(recordingTimerRef.current!);
        recordingTimerRef.current = null;
      }
    }, 500);
  }, []);

  const stopRecording = useCallback(async (): Promise<{ blob: Blob; fileName: string } | null> => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);

    const startIdx = recordingStartIdxRef.current;
    if (startIdx < 0 || startIdx >= chunksRef.current.length) {
      recordingStartIdxRef.current = -1;
      return null;
    }

    const recordedChunks = chunksRef.current.slice(startIdx);
    recordingStartIdxRef.current = -1;

    if (recordedChunks.length === 0) return null;

    const totalSize = recordedChunks.reduce((sum, c) => sum + c.data.byteLength, 0);
    const merged = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of recordedChunks) {
      merged.set(chunk.data, offset);
      offset += chunk.data.byteLength;
    }

    const mime = detectedMimeRef.current;
    const ext = mime.includes('aac') ? 'aac' : mime.includes('ogg') ? 'ogg' : 'mp3';
    const blob = new Blob([merged], { type: mime });
    const fileName = `recording_${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`;

    setRecordingAvailable(true);
    return { blob, fileName };
  }, []);

  // --- Seek back ---
  const seekBack = useCallback((seconds: number) => {
    const chunks = chunksRef.current;
    if (chunks.length < 2) return;

    const now = Date.now();
    const targetTime = now - (seconds * 1000);

    let startIdx = 0;
    for (let i = chunks.length - 1; i >= 0; i--) {
      if (chunks[i].timestamp <= targetTime) {
        startIdx = i;
        break;
      }
    }

    const seekChunks = chunks.slice(startIdx);
    if (seekChunks.length === 0) return;

    const totalSize = seekChunks.reduce((sum, c) => sum + c.data.byteLength, 0);
    const merged = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of seekChunks) {
      merged.set(chunk.data, offset);
      offset += chunk.data.byteLength;
    }

    if (seekBlobUrlRef.current) {
      URL.revokeObjectURL(seekBlobUrlRef.current);
    }

    const blob = new Blob([merged], { type: detectedMimeRef.current });
    const blobUrl = URL.createObjectURL(blob);
    seekBlobUrlRef.current = blobUrl;

    const audio = globalAudio;
    const wasPlaying = !audio.paused;
    audio.src = blobUrl;
    audio.load();
    if (wasPlaying) {
      audio.play().catch(() => {});
    }

    setIsLive(false);
    setCurrentSeekOffsetSeconds(seconds);
  }, []);

  const returnToLive = useCallback(() => {
    if (seekBlobUrlRef.current) {
      URL.revokeObjectURL(seekBlobUrlRef.current);
      seekBlobUrlRef.current = null;
    }

    const streamUrl = currentStation?.streamUrl;
    if (streamUrl) {
      const audio = globalAudio;
      audio.src = streamUrl;
      audio.load();
      audio.play().catch(() => {});
    }

    setIsLive(true);
    setCurrentSeekOffsetSeconds(0);
  }, [currentStation?.streamUrl]);

  const canSeekBack = bufferSeconds > 2;

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

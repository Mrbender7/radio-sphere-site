import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
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
  // Refs
  const chunksRef = useRef<TimestampedChunk[]>([]);
  const totalBytesRef = useRef(0);
  const cumulativeBytesRef = useRef(0);
  const recordingStartIdxRef = useRef(-1);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seekBlobUrlRef = useRef<string | null>(null);
  const trackedSrcRef = useRef<string | null>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const noChunkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noChunkRetryRef = useRef(0);
  const detectedMimeRef = useRef<string>("audio/mpeg");
  const isPlayingRef = useRef(false);

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

  const resetNoChunkWatchdog = useCallback(() => {
    if (noChunkTimeoutRef.current) {
      clearTimeout(noChunkTimeoutRef.current);
      noChunkTimeoutRef.current = null;
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

    // Reset watchdog on each chunk
    resetNoChunkWatchdog();
    noChunkRetryRef.current = 0;
    noChunkTimeoutRef.current = setTimeout(() => {
      console.warn("[StreamBuffer] No chunks for 15s, connection may be dead");
      setDebugInfo(d => ({ ...d, lastError: 'No data for 15s' }));
    }, 15000);
  }, [trimBuffer, resetNoChunkWatchdog]);

  // --- Fetch management ---
  const stopFetch = useCallback(() => {
    resetNoChunkWatchdog();
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
      fetchControllerRef.current = null;
    }
    setDebugInfo(d => ({ ...d, fetchActive: false }));
  }, [resetNoChunkWatchdog]);

  const startFetch = useCallback(async (streamUrl: string) => {
    if (fetchControllerRef.current) return; // Avoid double connections

    const controller = new AbortController();
    fetchControllerRef.current = controller;

    const fetchUrl = streamUrl;

    try {
      console.log("[StreamBuffer] Fetch stream started for:", fetchUrl);
      const response = await fetch(fetchUrl, {
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

      // Detect MIME
      const contentType = response.headers.get('content-type') || 'audio/mpeg';
      detectedMimeRef.current = contentType.split(';')[0].trim();
      console.log("[StreamBuffer] Fetch stream started, MIME:", detectedMimeRef.current);

      const reader = response.body.getReader();
      setDebugInfo(d => ({ ...d, fetchActive: true, lastError: '' }));

      // Start watchdog
      noChunkTimeoutRef.current = setTimeout(() => {
        console.warn("[StreamBuffer] No initial chunks after 15s");
        setDebugInfo(d => ({ ...d, lastError: 'No initial data' }));
      }, 15000);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) processChunk(value);
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.warn("[StreamBuffer] Fetch error:", e?.message);
        setDebugInfo(d => ({ ...d, fetchActive: false, lastError: e?.message || 'fetch error' }));

        // Try https:// upgrade if http:// failed (mixed content)
        if (fetchUrl.startsWith('http://') && !controller.signal.aborted) {
          console.log("[StreamBuffer] Retrying with HTTPS...");
          fetchControllerRef.current = null;
          startFetch(fetchUrl.replace('http://', 'https://'));
          return;
        }
      }
    }
    fetchControllerRef.current = null;
    setDebugInfo(d => ({ ...d, fetchActive: false }));
  }, [processChunk]);

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
        // Auto-stop
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

    // Find the chunk closest to targetTime
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

    // Revoke previous blob
    if (seekBlobUrlRef.current) {
      URL.revokeObjectURL(seekBlobUrlRef.current);
    }

    const blob = new Blob([merged], { type: detectedMimeRef.current });
    const blobUrl = URL.createObjectURL(blob);
    seekBlobUrlRef.current = blobUrl;

    // Swap the audio source to the blob
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

    // Restore the live stream URL
    const currentSrc = trackedSrcRef.current;
    if (currentSrc) {
      const audio = globalAudio;
      audio.src = currentSrc;
      audio.load();
      audio.play().catch(() => {});
    }

    setIsLive(true);
    setCurrentSeekOffsetSeconds(0);
  }, []);

  const canSeekBack = bufferSeconds > 2;

  // --- Observe globalAudio for src changes and play/pause ---
  useEffect(() => {
    const audio = globalAudio;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const checkAudioState = () => {
      const src = audio.src || null;
      const playing = !audio.paused && src !== null;

      // Ignore blob: URLs (those are our own seek-back blobs)
      const realSrc = src && !src.startsWith('blob:') ? src : null;

      // Detect station/src change
      if (realSrc !== trackedSrcRef.current) {
        console.log("[StreamBuffer] Audio src changed:", realSrc?.substring(0, 60));
        stopFetch();
        clearBuffer();
        trackedSrcRef.current = realSrc;

        if (realSrc && playing) {
          startFetch(realSrc);
        }
        isPlayingRef.current = playing;
        return;
      }

      // Detect play/pause transitions
      if (playing !== isPlayingRef.current) {
        isPlayingRef.current = playing;
        if (!playing && fetchControllerRef.current) {
          console.log("[StreamBuffer] Pause detected, stopping fetch but KEEPING buffer");
          stopFetch();
        } else if (playing && !fetchControllerRef.current && realSrc) {
          console.log("[StreamBuffer] Resume detected, restarting fetch");
          startFetch(realSrc);
        }
      }
    };

    // Poll every 500ms to detect changes (more reliable than events for cross-context)
    pollInterval = setInterval(checkAudioState, 500);
    // Also check immediately
    checkAudioState();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [startFetch, stopFetch, clearBuffer]);

  // Cleanup on unmount (only when provider is truly removed from tree)
  useEffect(() => {
    return () => {
      stopFetch();
      resetNoChunkWatchdog();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (seekBlobUrlRef.current) URL.revokeObjectURL(seekBlobUrlRef.current);
    };
  }, [stopFetch, resetNoChunkWatchdog]);

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

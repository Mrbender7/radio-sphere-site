import { usePlayer } from "@/contexts/PlayerContext";
import { useStreamBuffer } from "@/contexts/StreamBufferContext";

import { useTranslation } from "@/contexts/LanguageContext";
import { useTBMQuota } from "@/hooks/useTBMQuota";
import { TBMQuotaModal } from "@/components/TBMQuotaModal";
import { CassetteAnimation } from "@/components/CassetteAnimation";
import { ChevronDown, Play, Pause, Square, Circle, Rewind, FastForward, Radio } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef, useCallback, useEffect } from "react";

const MAX_BUFFER_DISPLAY = 5 * 60; // 300s = 5 min max display

interface TimebackMachineProps {
  onClose: () => void;
  onRecordingResult: (result: { blob: Blob; fileName: string }) => void;
}

export function TimebackMachine({ onClose, onRecordingResult }: TimebackMachineProps) {
  const { currentStation, isPlaying, togglePlay } = usePlayer();
  const isPremium = true; // Premium features always enabled on web
  const { t } = useTranslation();
  const {
    bufferSeconds,
    isRecording,
    recordingDuration,
    isLive,
    bufferAvailable,
    currentSeekOffsetSeconds,
    startRecording,
    stopRecording,
    seekBack,
    returnToLive,
  } = useStreamBuffer();

  const { canUseTBM, isWarning, trackUsage, isMobile: isMobileQuota } = useTBMQuota();
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const warningShownRef = useRef(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Track usage every second when not live (seeking)
  useEffect(() => {
    if (isLive || !isMobileQuota) return;
    const interval = setInterval(() => {
      trackUsage();
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive, isMobileQuota, trackUsage]);

  // Show warning toast once at 8 min
  useEffect(() => {
    if (isWarning && !warningShownRef.current) {
      warningShownRef.current = true;
      toast.info(t("tbmQuota.warning"), { duration: 5000 });
    }
  }, [isWarning, t]);

  const handleRewind = () => {
    if (!canUseTBM) { setShowQuotaModal(true); return; }
    const totalBuffer = Math.floor(bufferSeconds);
    if (totalBuffer < 2) return;
    const newOffset = Math.min(currentSeekOffsetSeconds + 15, totalBuffer);
    seekBack(newOffset);
  };

  const handleForward = () => {
    const newOffset = currentSeekOffsetSeconds - 15;
    if (newOffset <= 0) {
      returnToLive();
    } else {
      seekBack(newOffset);
    }
  };

  const handleRecToggle = async () => {
    if (!isPremium) {
      toast.error(t("player.recordPremiumOnly"));
      return;
    }
    if (isRecording) {
      const result = await stopRecording();
      if (result) {
        onRecordingResult(result);
      }
    } else {
      startRecording();
    }
  };

  const handleStop = () => {
    if (isRecording) {
      handleRecToggle();
    } else if (!isLive) {
      returnToLive();
    }
  };

  const handleReturnToLive = () => {
    returnToLive();
    onClose();
  };

  // --- Timeline calculations ---
  const totalBuffer = Math.floor(bufferSeconds);
  // Buffer fill: how much of the max buffer (300s) is filled
  const bufferFillPct = Math.min((totalBuffer / MAX_BUFFER_DISPLAY) * 100, 100);

  // Cursor position within the filled buffer area
  // When live: cursor at right edge of filled area
  // When seeking: cursor offset from right edge
  const cursorPosInBuffer = isLive ? totalBuffer : Math.max(0, totalBuffer - currentSeekOffsetSeconds);
  const cursorPct = totalBuffer > 0
    ? (cursorPosInBuffer / MAX_BUFFER_DISPLAY) * 100
    : 0;

  // Recording zone on timeline
  const recStartPct = isRecording && recordingDuration > 0
    ? Math.max(0, ((cursorPosInBuffer - recordingDuration) / MAX_BUFFER_DISPLAY) * 100)
    : 0;

  const formatTime = (s: number) => {
    const abs = Math.abs(Math.round(s));
    const m = Math.floor(abs / 60);
    const sec = abs % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  // --- Timeline interaction (click + touch drag) ---
  const seekFromPosition = useCallback((clientX: number) => {
    const el = timelineRef.current;
    if (!el || totalBuffer < 2) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    // Map click position to buffer time
    // pct=0 → oldest buffered point, pct=bufferFillPct/100 → live
    const maxPct = bufferFillPct / 100;
    if (pct >= maxPct - 0.02) {
      // Close enough to live edge
      returnToLive();
    } else if (pct <= maxPct) {
      const targetSeconds = pct * MAX_BUFFER_DISPLAY;
      const offset = totalBuffer - targetSeconds;
      if (offset <= 1) {
        returnToLive();
      } else {
        seekBack(Math.round(offset));
      }
    }
  }, [totalBuffer, bufferFillPct, seekBack, returnToLive]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    seekFromPosition(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    seekFromPosition(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    seekFromPosition(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!currentStation) return null;

  return (
    <div className="fixed inset-0 z-[55] bg-gradient-to-b from-[hsl(220,15%,6%)] via-[hsl(220,10%,8%)] to-[hsl(220,15%,4%)] flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4" style={{ paddingTop: "max(env(safe-area-inset-top, 24px), 1.5rem)" }}>
        <button onClick={onClose} className="p-2 -ml-2">
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-[hsl(35,80%,55%)] to-[hsl(25,70%,45%)]" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Timeback Machine
        </h1>
        <div className="w-10" />
      </div>

      {/* Cassette */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
        <CassetteAnimation
          duration={isRecording ? recordingDuration : Math.floor(bufferSeconds)}
          maxDuration={isRecording ? 600 : 300}
          stationName={currentStation.name}
          stationLogo={currentStation.logo}
          size="large"
          isSpinning={isPlaying && (!isLive || isRecording)}
          isRecording={isRecording}
        />

        {/* Buffer status indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className={`w-2 h-2 rounded-full ${totalBuffer > 2 ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
          {totalBuffer > 2
            ? `Buffer: ${formatTime(totalBuffer)} / 5:00`
            : t("player.bufferLoading") || "Chargement du buffer..."
          }
        </div>

        {/* Debug info */}
        <div className="w-full max-w-sm rounded-lg bg-accent/30 border border-border/50 px-3 py-2 space-y-1">
          <p className="text-[10px] font-mono text-muted-foreground">
            <span className="text-foreground/60">Status:</span> {bufferAvailable ? '✅ Active' : '❌ Inactive'} | 
            <span className="text-foreground/60"> Live:</span> {isLive ? '🟢' : '🔴'} | 
            <span className="text-foreground/60"> Seek:</span> {currentSeekOffsetSeconds}s
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            <span className="text-foreground/60">Buffer:</span> {formatTime(totalBuffer)} / 5:00 | 
            <span className="text-foreground/60"> Rec:</span> {isRecording ? `🔴 ${formatTime(recordingDuration)}` : 'Off'}
          </p>
        </div>


        {/* Transport controls */}
        <div className="flex items-center justify-center gap-3">
          {/* Rewind */}
          <button
            onClick={handleRewind}
            disabled={totalBuffer < 2}
            className="transport-btn w-12 h-12 rounded-lg bg-gradient-to-b from-[hsl(0,0%,22%)] to-[hsl(0,0%,14%)] border border-[hsl(0,0%,28%)] flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] active:translate-y-0.5 transition-all disabled:opacity-30"
          >
            <Rewind className="w-5 h-5 text-foreground" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="transport-btn w-14 h-14 rounded-lg bg-gradient-to-b from-[hsl(0,0%,25%)] to-[hsl(0,0%,15%)] border border-[hsl(0,0%,30%)] flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.6)] active:translate-y-0.5 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-foreground" />
            ) : (
              <Play className="w-6 h-6 text-foreground ml-0.5" />
            )}
          </button>

          {/* Stop */}
          <button
            onClick={handleStop}
            className="transport-btn w-12 h-12 rounded-lg bg-gradient-to-b from-[hsl(0,0%,22%)] to-[hsl(0,0%,14%)] border border-[hsl(0,0%,28%)] flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] active:translate-y-0.5 transition-all"
          >
            <Square className="w-5 h-5 text-foreground" />
          </button>

          {/* Record */}
          <button
            onClick={handleRecToggle}
            className={`transport-btn w-12 h-12 rounded-lg flex items-center justify-center border transition-all active:translate-y-0.5 ${
              isRecording
                ? "bg-gradient-to-b from-red-600 to-red-800 border-red-500 shadow-[0_4px_12px_rgba(239,68,68,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]"
                : "bg-gradient-to-b from-[hsl(0,0%,22%)] to-[hsl(0,0%,14%)] border-[hsl(0,0%,28%)] shadow-[0_4px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]"
            } active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]`}
          >
            <Circle className={`w-5 h-5 ${isRecording ? "text-white fill-white rec-blink" : "text-red-500 fill-red-500"}`} />
          </button>

          {/* Forward */}
          <button
            onClick={handleForward}
            disabled={isLive}
            className="transport-btn w-12 h-12 rounded-lg bg-gradient-to-b from-[hsl(0,0%,22%)] to-[hsl(0,0%,14%)] border border-[hsl(0,0%,28%)] flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] active:translate-y-0.5 transition-all disabled:opacity-30"
          >
            <FastForward className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Buffer timeline */}
        <div className="w-full max-w-sm space-y-2">
          <div
            ref={timelineRef}
            className="relative h-4 rounded-full bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,18%)] overflow-hidden cursor-pointer touch-none"
            onClick={handleTimelineClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Background: total possible buffer (5 min) */}
            <div className="absolute inset-0 rounded-full bg-[hsl(0,0%,10%)]" />

            {/* Buffered area — grows as buffer fills */}
            <div
              className="absolute top-0 bottom-0 left-0 rounded-full bg-[hsl(0,0%,20%)] transition-all duration-1000 ease-linear"
              style={{ width: `${bufferFillPct}%` }}
            />

            {/* Recording zone (red) */}
            {isRecording && recordingDuration > 0 && (
              <div
                className="absolute top-0 bottom-0 bg-red-500/30 rounded-full"
                style={{ left: `${recStartPct}%`, width: `${cursorPct - recStartPct}%` }}
              />
            )}

            {/* Played/position indicator */}
            <div
              className="absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r from-[hsl(35,80%,35%)] to-[hsl(35,80%,50%)] transition-all duration-300"
              style={{ width: `${cursorPct}%` }}
            />

            {/* Cursor thumb */}
            {totalBuffer > 1 && (
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[hsl(35,80%,55%)] border-2 border-[hsl(35,90%,70%)] shadow-[0_0_10px_rgba(200,150,50,0.6)] transition-all duration-300 ${isDragging ? 'scale-125' : ''}`}
                style={{ left: `calc(${cursorPct}% - 10px)` }}
              />
            )}
          </div>

          {/* Time labels */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-mono">
              -{formatTime(totalBuffer)}
            </span>

            {/* Current offset when seeking */}
            {!isLive && (
              <span className="text-xs font-mono font-bold text-[hsl(35,80%,55%)]">
                -{formatTime(currentSeekOffsetSeconds)}
              </span>
            )}

            <button
              onClick={handleReturnToLive}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                isLive
                  ? "text-green-400 live-pulse"
                  : "text-muted-foreground bg-accent hover:text-green-400"
              }`}
            >
              <Radio className="w-3 h-3" />
              {t("player.live")}
            </button>
          </div>

          {/* Recording timer */}
          {isRecording && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <div className="w-2 h-2 rounded-full bg-red-500 rec-blink" />
              <span className="text-sm font-mono font-bold text-red-400 tracking-wider">
                REC {formatTime(recordingDuration)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-[calc(max(env(safe-area-inset-bottom,16px),1rem)+1rem)]">
        <button
          onClick={() => {
            if (!isLive) returnToLive();
            onClose();
          }}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30 active:scale-[0.98]"
        >
          {t("player.returnToLive")}
        </button>
      </div>
    </div>
  );
}

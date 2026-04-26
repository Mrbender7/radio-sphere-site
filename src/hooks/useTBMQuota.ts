import { useState, useCallback, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { safeGetItem, safeSetItem } from "@/utils/safeStorage";

const STORAGE_KEY = "radiosphere_tbm_quota";
const MAX_SECONDS = 600; // 10 min
const WARNING_THRESHOLD = 480; // 8 min

interface QuotaData {
  date: string;
  usedSeconds: number;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadQuota(): QuotaData {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as QuotaData;
      if (parsed.date === getTodayKey()) return parsed;
    }
  } catch {}
  return { date: getTodayKey(), usedSeconds: 0 };
}

function saveQuota(data: QuotaData) {
  safeSetItem(STORAGE_KEY, JSON.stringify(data));
}

export function useTBMQuota() {
  const isMobile = useIsMobile();
  const [usedSeconds, setUsedSeconds] = useState(() => loadQuota().usedSeconds);

  // Reset if day changed
  useEffect(() => {
    const current = loadQuota();
    setUsedSeconds(current.usedSeconds);
  }, []);

  const trackUsage = useCallback(() => {
    if (!isMobile) return;
    setUsedSeconds((prev) => {
      const next = prev + 1;
      saveQuota({ date: getTodayKey(), usedSeconds: next });
      return next;
    });
  }, [isMobile]);

  const canUseTBM = !isMobile || usedSeconds < MAX_SECONDS;
  const isWarning = isMobile && usedSeconds >= WARNING_THRESHOLD && usedSeconds < MAX_SECONDS;

  return {
    canUseTBM,
    usedSeconds,
    maxSeconds: MAX_SECONDS,
    isWarning,
    isMobile,
    trackUsage,
  };
}

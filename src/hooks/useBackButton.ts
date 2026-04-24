import { useEffect, useRef, useCallback } from "react";
import { isCapacitorNative } from "@/utils/inAppBrowser";

interface UseBackButtonProps {
  onBack: () => void;
  onDoubleBackHome: () => void;
  isHome: boolean;
  isFullScreen: boolean;
}

/**
 * Hardware/system back-button handling.
 *
 * IMPORTANT: We only register a back-button listener on TRUE Capacitor native
 * shells. Inside browsers (including in-app WebViews like Facebook/Instagram),
 * we deliberately do NOTHING — pushing history entries on mount and re-pushing
 * on popstate would trap the user on the page and break in-app navigation.
 */
export function useBackButton({
  onBack,
  onDoubleBackHome,
  isHome,
  isFullScreen,
}: UseBackButtonProps) {
  const lastBackPressRef = useRef<number>(0);
  const backPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isHomeRef = useRef(isHome);
  const isFullScreenRef = useRef(isFullScreen);
  const onBackRef = useRef(onBack);
  const onDoubleBackHomeRef = useRef(onDoubleBackHome);

  useEffect(() => { isHomeRef.current = isHome; }, [isHome]);
  useEffect(() => { isFullScreenRef.current = isFullScreen; }, [isFullScreen]);
  useEffect(() => { onBackRef.current = onBack; }, [onBack]);
  useEffect(() => { onDoubleBackHomeRef.current = onDoubleBackHome; }, [onDoubleBackHome]);

  const handleBackPress = useCallback(() => {
    if (isFullScreenRef.current) {
      onBackRef.current();
      return;
    }
    if (!isHomeRef.current) {
      onBackRef.current();
      return;
    }
    // On home → double-tap to exit
    const now = Date.now();
    const timeSinceLastPress = now - lastBackPressRef.current;
    if (timeSinceLastPress < 300) {
      if (backPressTimeoutRef.current) clearTimeout(backPressTimeoutRef.current);
      onDoubleBackHomeRef.current();
      lastBackPressRef.current = 0;
    } else {
      lastBackPressRef.current = now;
      if (backPressTimeoutRef.current) clearTimeout(backPressTimeoutRef.current);
      backPressTimeoutRef.current = setTimeout(() => {
        lastBackPressRef.current = 0;
      }, 300);
    }
  }, []);

  useEffect(() => {
    // ONLY hook into the back button on real Capacitor native apps.
    // In any browser context (including in-app WebViews), do nothing —
    // letting the OS / browser handle navigation natively.
    if (!isCapacitorNative()) {
      return;
    }

    let nativeListenerRemove: (() => void) | null = null;

    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const listener = await App.addListener("backButton", () => {
          handleBackPress();
        });
        nativeListenerRemove = () => listener.remove();
        console.log("[RadioSphere] Native backButton listener registered");
      } catch (e) {
        console.warn("[RadioSphere] Failed to register native backButton listener:", e);
      }
    })();

    return () => {
      if (nativeListenerRemove) nativeListenerRemove();
      if (backPressTimeoutRef.current) clearTimeout(backPressTimeoutRef.current);
    };
  }, [handleBackPress]);
}

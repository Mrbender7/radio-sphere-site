import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useArtworkCache } from "@/hooks/useArtworkCache";
import { cn } from "@/lib/utils";
import stationPlaceholder from "@/assets/station-placeholder.png";

interface SmartArtworkProps {
  stationId: string;
  originalUrl?: string;
  homepage?: string;
  stationName?: string;
  alt: string;
  className?: string;
}

export function SmartArtwork({
  stationId,
  originalUrl = "",
  homepage = "",
  stationName = "",
  alt,
  className,
}: SmartArtworkProps) {
  const { src: resolvedSrc } = useArtworkCache(stationId, originalUrl, homepage, stationName);

  // The "visible" src: starts with original, only swaps once HD is preloaded
  const immediateSrc = originalUrl?.replace("http://", "https://") || stationPlaceholder;
  const [displaySrc, setDisplaySrc] = useState(immediateSrc);
  const [swapping, setSwapping] = useState(false);
  const preloadRef = useRef<HTMLImageElement | null>(null);

  // When the resolved HD src changes, preload it invisibly, then swap
  useEffect(() => {
    if (!resolvedSrc || resolvedSrc === displaySrc) return;

    // Preload the new image in memory before showing it
    const img = new Image();
    preloadRef.current = img;
    img.onload = () => {
      if (preloadRef.current !== img) return; // stale
      setSwapping(true);
      // Small delay so AnimatePresence can animate
      requestAnimationFrame(() => {
        setDisplaySrc(resolvedSrc);
      });
    };
    img.onerror = () => {
      // HD failed to load — keep current image
    };
    img.src = resolvedSrc;

    return () => {
      preloadRef.current = null;
    };
  }, [resolvedSrc]);

  return (
    <div className={cn("relative overflow-hidden w-full h-full", className)}>
      <AnimatePresence mode="popLayout">
        <motion.img
          key={displaySrc}
          src={displaySrc}
          alt={alt}
          loading="lazy"
          initial={swapping ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full h-full object-cover"
          onLoad={() => setSwapping(false)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = stationPlaceholder;
          }}
        />
      </AnimatePresence>
    </div>
  );
}

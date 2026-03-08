import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useArtworkCache } from "@/hooks/useArtworkCache";
import { cn } from "@/lib/utils";
import stationPlaceholder from "@/assets/station-placeholder.png";

interface SmartArtworkProps {
  stationId: string;
  originalUrl?: string;
  homepage?: string;
  alt: string;
  className?: string;
}

export function SmartArtwork({
  stationId,
  originalUrl = "",
  homepage = "",
  alt,
  className,
}: SmartArtworkProps) {
  const { src, isLoading, isResolved } = useArtworkCache(stationId, originalUrl, homepage);
  const [imgLoaded, setImgLoaded] = useState(false);
  const isPlaceholder = !originalUrl && !isResolved;

  return (
    <div className={cn("relative overflow-hidden w-full h-full", className)}>
      {/* Shimmer skeleton while loading */}
      <AnimatePresence>
        {(isLoading || !imgLoaded) && (
          <motion.div
            key="shimmer"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-10"
          >
            <div className="w-full h-full bg-muted animate-pulse" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, hsl(var(--accent) / 0.4) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actual image with fade-in */}
      <motion.img
        key={src}
        src={src}
        alt={alt}
        loading="lazy"
        initial={{ opacity: 0 }}
        animate={{ opacity: imgLoaded ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "w-full h-full object-cover",
          isPlaceholder && "mask-radial-fade"
        )}
        onLoad={() => setImgLoaded(true)}
        onError={(e) => {
          (e.target as HTMLImageElement).src = stationPlaceholder;
          setImgLoaded(true);
        }}
      />
    </div>
  );
}

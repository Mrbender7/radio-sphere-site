import { useState } from "react";
import { cn } from "@/lib/utils";
import stationPlaceholder from "@/assets/station-placeholder.png";

interface SmartArtworkProps {
  stationId?: string;
  originalUrl?: string;
  homepage?: string;
  stationName?: string;
  alt: string;
  className?: string;
}

export function SmartArtwork({
  originalUrl = "",
  alt,
  className,
}: SmartArtworkProps) {
  const [src, setSrc] = useState(originalUrl || stationPlaceholder);

  return (
    <div className={cn("relative overflow-hidden w-full h-full", className)}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-cover"
        onError={() => {
          if (src !== stationPlaceholder) {
            setSrc(stationPlaceholder);
          }
        }}
      />
    </div>
  );
}

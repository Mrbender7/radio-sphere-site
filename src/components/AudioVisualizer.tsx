import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface AudioVisualizerProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

const sizeConfig = {
  small: { bars: 4, height: 16, gap: 2, barWidth: 9 },
  medium: { bars: 5, height: 24, gap: 2, barWidth: 9 },
  large: { bars: 9, height: 40, gap: 3, barWidth: 12 },
};

const barAnimations = [
  { duration: "0.45s", delay: "0s" },
  { duration: "0.55s", delay: "0.1s" },
  { duration: "0.4s", delay: "0.2s" },
  { duration: "0.6s", delay: "0.05s" },
  { duration: "0.5s", delay: "0.15s" },
  { duration: "0.65s", delay: "0.08s" },
  { duration: "0.42s", delay: "0.22s" },
  { duration: "0.58s", delay: "0.12s" },
  { duration: "0.48s", delay: "0.18s" },
];

export function AudioVisualizer({ size = "small", className }: AudioVisualizerProps) {
  const { bars, height, gap, barWidth } = sizeConfig[size];
  const totalWidth = bars * barWidth + (bars - 1) * gap;
  const instanceAnimations = useMemo(
    () => Array.from({ length: bars }, (_, i) => {
      const base = barAnimations[i % barAnimations.length];
      const variance = Math.random() * 0.28 - 0.14;
      const duration = `${Math.max(0.28, parseFloat(base.duration) + variance).toFixed(2)}s`;
      const delay = `${(Math.random() * 0.36).toFixed(2)}s`;
      const minScale = (0.12 + Math.random() * 0.36).toFixed(2);

      return { duration, delay, minScale };
    }),
    [bars]
  );

  return (
    <div className={cn("flex items-end justify-center", className)} style={{ height, width: totalWidth, gap }}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: barWidth,
            height: "100%",
            background: "linear-gradient(to top, hsl(var(--primary)), hsl(var(--accent-foreground)))",
            animation: `equalizer-bar ${instanceAnimations[i].duration} ease-in-out ${instanceAnimations[i].delay} infinite alternate`,
            transformOrigin: "bottom",
            ["--bar-min-scale" as string]: instanceAnimations[i].minScale,
          }}
        />
      ))}
      <style>{`
        @keyframes equalizer-bar {
          0% { transform: scaleY(var(--bar-min-scale)); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

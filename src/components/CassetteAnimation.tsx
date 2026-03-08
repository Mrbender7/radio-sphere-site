import stationPlaceholder from "@/assets/station-placeholder.png";

interface CassetteAnimationProps {
  duration: number;
  maxDuration?: number;
  stationName?: string;
  stationLogo?: string;
  size?: "small" | "large";
  isSpinning?: boolean;
  isRecording?: boolean;
}

export function CassetteAnimation({
  duration,
  maxDuration = 600,
  stationName = "RadioSphere",
  stationLogo,
  size = "small",
  isSpinning = true,
  isRecording = false,
}: CassetteAnimationProps) {
  const progress = Math.min(duration / maxDuration, 1);
  const leftSpeed = 2 + (1 - progress) * 3;
  const rightSpeed = 5 - progress * 3;

  const isLarge = size === "large";
  const bodyW = isLarge ? "w-80" : "w-56";
  const bodyH = isLarge ? "h-52" : "h-36";
  const reelSize = isLarge ? "w-14 h-14" : "w-10 h-10";
  const reelInner = isLarge ? "w-4 h-4" : "w-3 h-3";
  const spokeH = isLarge ? "h-12" : "h-8";
  const windowTop = isLarge ? "top-[4.5rem]" : "top-14";
  const windowH = isLarge ? "h-20" : "h-14";
  const labelH = isLarge ? "h-12" : "h-8";
  const labelTop = isLarge ? "top-3" : "top-2";
  const labelFontSize = isLarge ? "text-xs" : "text-[10px]";

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Cassette body */}
      <div className={`relative ${bodyW} ${bodyH} rounded-xl bg-gradient-to-b from-[hsl(30,40%,25%)] to-[hsl(25,35%,18%)] border-2 border-[hsl(30,30%,30%)] shadow-[inset_0_2px_8px_rgba(255,200,100,0.1),0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden`}>
        {/* Top label area */}
        <div className={`absolute ${labelTop} left-4 right-4 ${labelH} rounded bg-[hsl(45,60%,85%)] flex items-center justify-center px-2`}>
          <span className={`${labelFontSize} font-bold text-[hsl(25,40%,25%)] tracking-widest uppercase truncate`}>
            {stationName}
          </span>
        </div>

        {/* Tape window */}
        <div className={`absolute ${windowTop} left-6 right-6 ${windowH} rounded-lg bg-[hsl(220,10%,8%)] border border-[hsl(30,20%,35%)] flex items-center justify-between px-4 overflow-hidden`}>
          {/* Left reel */}
          <div
            className={`${reelSize} rounded-full border-2 border-[hsl(30,30%,45%)] bg-[hsl(220,10%,12%)] flex items-center justify-center relative ${isSpinning ? "cassette-reel-spin" : ""}`}
            style={isSpinning ? { animationDuration: `${leftSpeed}s` } : undefined}
          >
            <div className={`${reelInner} rounded-full bg-[hsl(30,30%,40%)]`} />
            <div className={`absolute w-[2px] ${spokeH} bg-[hsl(30,20%,35%)] rotate-0`} />
            <div className={`absolute w-[2px] ${spokeH} bg-[hsl(30,20%,35%)] rotate-60`} />
            <div className={`absolute w-[2px] ${spokeH} bg-[hsl(30,20%,35%)] rotate-[120deg]`} />
          </div>

          {/* Center: station logo (vintage) or tape band */}
          {isLarge && stationLogo ? (
            <div className="flex-1 mx-3 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-[hsl(30,20%,35%)] vintage-filter">
                <img
                  src={stationLogo.replace('http://', 'https://')}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = stationPlaceholder; }}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 mx-2 h-[2px] bg-gradient-to-r from-[hsl(25,60%,30%)] via-[hsl(25,50%,40%)] to-[hsl(25,60%,30%)]" />
          )}

          {/* Right reel */}
          <div
            className={`${reelSize} rounded-full border-2 border-[hsl(30,30%,45%)] bg-[hsl(220,10%,12%)] flex items-center justify-center relative ${isSpinning ? "cassette-reel-spin" : ""}`}
            style={isSpinning ? { animationDuration: `${rightSpeed}s` } : undefined}
          >
            <div className={`${reelInner} rounded-full bg-[hsl(30,30%,40%)]`} />
            <div className={`absolute w-[2px] ${spokeH} bg-[hsl(30,20%,35%)] rotate-0`} />
            <div className={`absolute w-[2px] ${spokeH} bg-[hsl(30,20%,35%)] rotate-60`} />
            <div className={`absolute w-[2px] ${spokeH} bg-[hsl(30,20%,35%)] rotate-[120deg]`} />
          </div>
        </div>

        {/* Bottom screws */}
        <div className="absolute bottom-2 left-6 w-2 h-2 rounded-full bg-[hsl(30,20%,40%)]" />
        <div className="absolute bottom-2 right-6 w-2 h-2 rounded-full bg-[hsl(30,20%,40%)]" />
      </div>

      {/* Recording counter */}
      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 rec-blink" />
          <span className="text-sm font-mono font-bold text-red-400 tracking-wider">
            {formatTime(duration)}
          </span>
          <span className="text-xs text-muted-foreground">
            / {formatTime(maxDuration)}
          </span>
        </div>
      )}
    </div>
  );
}

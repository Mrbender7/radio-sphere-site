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
      {/* Cassette body — 3D depth */}
      <div
        className={`relative ${bodyW} ${bodyH} rounded-xl overflow-hidden`}
        style={{
          background: 'linear-gradient(180deg, hsl(30,40%,28%) 0%, hsl(25,35%,20%) 40%, hsl(25,30%,15%) 100%)',
          border: '2px solid hsl(30,30%,32%)',
          boxShadow: `
            inset 0 2px 4px rgba(255,220,150,0.12),
            inset 0 -3px 6px rgba(0,0,0,0.4),
            0 8px 32px rgba(0,0,0,0.6),
            0 2px 4px rgba(0,0,0,0.3)
          `,
        }}
      >
        {/* Top highlight bevel */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[hsla(35,60%,60%,0.25)] to-transparent" />

        {/* Left/Right edge bevels */}
        <div className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-[hsla(35,50%,50%,0.15)] via-transparent to-transparent" />
        <div className="absolute inset-y-0 right-0 w-[2px] bg-gradient-to-b from-[hsla(35,50%,50%,0.1)] via-transparent to-[hsla(0,0%,0%,0.2)]" />

        {/* Top label area with texture */}
        <div
          className={`absolute ${labelTop} left-4 right-4 ${labelH} rounded flex items-center justify-center px-2`}
          style={{
            background: 'linear-gradient(180deg, hsl(45,60%,88%) 0%, hsl(45,55%,80%) 100%)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.2)',
          }}
        >
          {/* Label lines */}
          <div className="absolute inset-x-3 top-1 border-t border-[hsla(25,40%,40%,0.15)]" />
          <div className="absolute inset-x-3 bottom-1 border-b border-[hsla(25,40%,40%,0.15)]" />
          <span className={`${labelFontSize} font-bold text-[hsl(25,40%,25%)] tracking-widest uppercase truncate relative z-10`}>
            {stationName}
          </span>
        </div>

        {/* Tape window with depth */}
        <div
          className={`absolute ${windowTop} left-6 right-6 ${windowH} rounded-lg flex items-center justify-between px-4 overflow-hidden`}
          style={{
            background: 'linear-gradient(180deg, hsl(220,10%,6%) 0%, hsl(220,8%,10%) 50%, hsl(220,10%,7%) 100%)',
            border: '1.5px solid hsl(30,20%,30%)',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6), inset 0 -1px 3px rgba(0,0,0,0.3), 0 1px 0 hsla(30,30%,40%,0.3)',
          }}
        >
          {/* Left reel */}
          <div
            className={`${reelSize} rounded-full flex items-center justify-center relative ${isSpinning ? "cassette-reel-spin" : ""}`}
            style={{
              animationDuration: isSpinning ? `${leftSpeed}s` : undefined,
              background: 'radial-gradient(circle, hsl(220,10%,14%) 30%, hsl(220,8%,10%) 100%)',
              border: '2px solid hsl(30,25%,40%)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5), 0 0 4px rgba(200,150,50,0.1)',
            }}
          >
            <div className={`${reelInner} rounded-full bg-[hsl(30,30%,42%)]`} style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)' }} />
            {/* Hub teeth */}
            {[0, 60, 120, 180, 240, 300].map(deg => (
              <div key={deg} className="absolute w-[1.5px] bg-[hsl(30,20%,35%)]" style={{ height: isLarge ? '10px' : '7px', transform: `rotate(${deg}deg)`, transformOrigin: 'center center' }} />
            ))}
          </div>

          {/* Tape path between reels */}
          <div className="flex-1 mx-2 relative">
            {/* Upper tape path */}
            <div className="absolute top-1/2 -translate-y-[6px] inset-x-0 h-[1.5px] bg-gradient-to-r from-[hsl(25,50%,28%)] via-[hsl(25,40%,35%)] to-[hsl(25,50%,28%)]" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} />
            {/* Lower tape path */}
            <div className="absolute top-1/2 translate-y-[4px] inset-x-0 h-[1.5px] bg-gradient-to-r from-[hsl(25,50%,25%)] via-[hsl(25,35%,30%)] to-[hsl(25,50%,25%)]" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} />

            {/* Center: station logo */}
            {isLarge && stationLogo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-[hsl(30,20%,35%)] vintage-filter" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  <img
                    src={stationLogo.replace('http://', 'https://')}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = stationPlaceholder; }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right reel */}
          <div
            className={`${reelSize} rounded-full flex items-center justify-center relative ${isSpinning ? "cassette-reel-spin" : ""}`}
            style={{
              animationDuration: isSpinning ? `${rightSpeed}s` : undefined,
              background: 'radial-gradient(circle, hsl(220,10%,14%) 30%, hsl(220,8%,10%) 100%)',
              border: '2px solid hsl(30,25%,40%)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5), 0 0 4px rgba(200,150,50,0.1)',
            }}
          >
            <div className={`${reelInner} rounded-full bg-[hsl(30,30%,42%)]`} style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)' }} />
            {[0, 60, 120, 180, 240, 300].map(deg => (
              <div key={deg} className="absolute w-[1.5px] bg-[hsl(30,20%,35%)]" style={{ height: isLarge ? '10px' : '7px', transform: `rotate(${deg}deg)`, transformOrigin: 'center center' }} />
            ))}
          </div>
        </div>

        {/* Reflective highlight strip */}
        <div className="absolute left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[hsla(35,60%,70%,0.15)] to-transparent" style={{ bottom: isLarge ? '2.5rem' : '1.75rem' }} />

        {/* Bottom screws with 3D effect */}
        <div className="absolute bottom-2 left-6 w-2.5 h-2.5 rounded-full" style={{ background: 'radial-gradient(circle at 35% 35%, hsl(30,25%,50%), hsl(30,20%,30%))', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 1px 2px rgba(0,0,0,0.3)' }}>
          <div className="absolute inset-[3px] border-t border-[hsla(30,10%,20%,0.5)]" />
        </div>
        <div className="absolute bottom-2 right-6 w-2.5 h-2.5 rounded-full" style={{ background: 'radial-gradient(circle at 35% 35%, hsl(30,25%,50%), hsl(30,20%,30%))', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 1px 2px rgba(0,0,0,0.3)' }}>
          <div className="absolute inset-[3px] border-t border-[hsla(30,10%,20%,0.5)]" />
        </div>

        {/* Bottom shadow for volume/3D effect */}
        <div className="absolute inset-x-0 -bottom-1 h-3 bg-gradient-to-t from-[hsla(0,0%,0%,0.4)] to-transparent rounded-b-xl" />
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

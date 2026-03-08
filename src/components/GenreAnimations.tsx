
interface GenreAnimationProps {
  genre: string;
}

const svgBase = "absolute right-2 top-1/2 -translate-y-1/2 w-14 h-14 opacity-90";

const gradientDef = (
  <defs>
    <linearGradient id="genre-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="hsl(220,90%,70%)" />
      <stop offset="100%" stopColor="hsl(280,80%,70%)" />
    </linearGradient>
  </defs>
);

const G = "url(#genre-grad)";
const S = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none", stroke: G };

function PeaceSign() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <circle cx="40" cy="40" r="26" strokeWidth="3" {...S} />
      <line x1="40" y1="14" x2="40" y2="66" strokeWidth="3" {...S} />
      <line x1="40" y1="40" x2="22" y2="58" strokeWidth="3" {...S} />
      <line x1="40" y1="40" x2="58" y2="58" strokeWidth="3" {...S} />
    </svg>
  );
}

function Vinyl() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <circle cx="40" cy="40" r="28" strokeWidth="2.5" {...S} />
      <circle cx="40" cy="40" r="20" strokeWidth="1.5" {...S} opacity="0.5" />
      <circle cx="40" cy="40" r="10" strokeWidth="2" {...S} />
      <circle cx="40" cy="40" r="4" fill={G} />
    </svg>
  );
}

function Boombox() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <rect x="8" y="22" width="64" height="40" rx="6" strokeWidth="2.5" {...S} />
      <circle cx="28" cy="46" r="10" strokeWidth="2.5" {...S} />
      <circle cx="28" cy="46" r="4" strokeWidth="1.5" {...S} />
      <circle cx="52" cy="46" r="10" strokeWidth="2.5" {...S} />
      <circle cx="52" cy="46" r="4" strokeWidth="1.5" {...S} />
      <rect x="22" y="26" width="36" height="8" rx="2" strokeWidth="1.5" {...S} />
      <line x1="34" y1="18" x2="46" y2="8" strokeWidth="2" {...S} />
    </svg>
  );
}

function Equalizer() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      {[14, 26, 38, 50, 62].map((x, i) => {
        const heights = [36, 48, 28, 42, 32];
        const h = heights[i];
        return <rect key={i} x={x} y={70 - h} width="8" height={h} rx="3" strokeWidth="2" {...S} fill={G} fillOpacity="0.2" />;
      })}
    </svg>
  );
}

function CloudWave() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <path d="M8,50 Q20,20 40,40 Q60,60 72,30" strokeWidth="3" {...S} />
      <path d="M8,58 Q24,34 40,50 Q56,66 72,42" strokeWidth="2" {...S} opacity="0.4" />
      <circle cx="40" cy="40" r="3" fill={G} opacity="0.6" />
    </svg>
  );
}

function SineWave() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <path d="M4,40 Q20,10 40,40 Q60,70 76,40" strokeWidth="3" {...S} />
      <path d="M4,50 Q20,24 40,50 Q60,76 76,50" strokeWidth="2" {...S} opacity="0.35" />
    </svg>
  );
}

function Piano() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <rect x="10" y="20" width="60" height="44" rx="4" strokeWidth="2.5" {...S} />
      {[22, 32, 42, 52, 62].map((x, i) => (
        <line key={i} x1={x} y1="20" x2={x} y2="64" strokeWidth="1.5" {...S} opacity="0.4" />
      ))}
      {[26, 36, 50, 56].map((x, i) => (
        <rect key={i} x={x} y="20" width="5" height="26" rx="1" strokeWidth="1.5" {...S} fill={G} fillOpacity="0.25" />
      ))}
    </svg>
  );
}

function CowboyHat() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <path d="M6,56 C18,48 28,46 40,46 C52,46 62,48 74,56" strokeWidth="2.5" {...S} />
      <path d="M6,56 C18,62 28,64 40,64 C52,64 62,62 74,56" strokeWidth="2.5" {...S} />
      <path d="M24,46 C22,38 22,26 28,20 C34,14 40,16 40,16 C40,16 46,14 52,20 C58,26 58,38 56,46" strokeWidth="2.5" {...S} />
      <line x1="26" y1="40" x2="54" y2="40" strokeWidth="1.5" {...S} opacity="0.5" />
    </svg>
  );
}

function Circuit() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <circle cx="40" cy="40" r="6" strokeWidth="2.5" {...S} fill={G} fillOpacity="0.2" />
      <line x1="40" y1="10" x2="40" y2="34" strokeWidth="2" {...S} />
      <line x1="40" y1="46" x2="40" y2="70" strokeWidth="2" {...S} />
      <line x1="10" y1="40" x2="34" y2="40" strokeWidth="2" {...S} />
      <line x1="46" y1="40" x2="70" y2="40" strokeWidth="2" {...S} />
      <circle cx="40" cy="10" r="3" fill={G} />
      <circle cx="40" cy="70" r="3" fill={G} />
      <circle cx="10" cy="40" r="3" fill={G} />
      <circle cx="70" cy="40" r="3" fill={G} />
    </svg>
  );
}

function FunkGroove() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <path d="M8,50 C16,30 24,55 32,35 C40,55 48,25 56,45 C64,60 72,30 76,40" strokeWidth="3" {...S} />
      <circle cx="20" cy="42" r="4" fill={G} fillOpacity="0.3" strokeWidth="1.5" {...S} />
      <circle cx="56" cy="38" r="4" fill={G} fillOpacity="0.3" strokeWidth="1.5" {...S} />
    </svg>
  );
}

function Microphone() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <rect x="30" y="12" width="20" height="30" rx="10" strokeWidth="2.5" {...S} />
      <line x1="40" y1="42" x2="40" y2="58" strokeWidth="2.5" {...S} />
      <line x1="28" y1="58" x2="52" y2="58" strokeWidth="2.5" {...S} />
      <path d="M22,34 Q22,52 40,52 Q58,52 58,34" strokeWidth="2" {...S} />
    </svg>
  );
}

function Saxophone() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <path d="M24,10 L28,10 L30,16" strokeWidth="2.5" {...S} />
      <path d="M30,16 L32,30" strokeWidth="2.5" {...S} />
      <path d="M32,30 C32,36 34,42 38,48 C42,54 46,58 46,64 C46,70 42,74 36,74 C30,74 26,70 26,64" strokeWidth="2.5" {...S} />
      <circle cx="34" cy="36" r="2" fill={G} />
      <circle cx="36" cy="44" r="2" fill={G} />
      <circle cx="40" cy="52" r="2" fill={G} />
    </svg>
  );
}

function Maracas() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <ellipse cx="28" cy="24" rx="11" ry="15" strokeWidth="2.5" {...S} />
      <line x1="28" y1="39" x2="28" y2="66" strokeWidth="2.5" {...S} />
      <ellipse cx="54" cy="28" rx="9" ry="13" strokeWidth="2" {...S} />
      <line x1="54" y1="41" x2="54" y2="64" strokeWidth="2" {...S} />
      <circle cx="25" cy="20" r="1.5" fill={G} opacity="0.6" />
      <circle cx="31" cy="26" r="1.5" fill={G} opacity="0.6" />
      <circle cx="52" cy="24" r="1.5" fill={G} opacity="0.5" />
    </svg>
  );
}

function Lightning() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <polygon points="44,6 22,40 36,40 30,74 58,34 44,34" strokeWidth="2.5" {...S} fill={G} fillOpacity="0.15" />
    </svg>
  );
}

function Antenna() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <line x1="40" y1="68" x2="40" y2="30" strokeWidth="2.5" {...S} />
      <circle cx="40" cy="28" r="3" fill={G} />
      <line x1="28" y1="68" x2="52" y2="68" strokeWidth="2.5" {...S} />
      {[12, 20, 28].map((r, i) => (
        <path key={i} d={`M${40 - r},28 A${r},${r} 0 0,1 ${40 + r},28`} strokeWidth="2" {...S} opacity={1 - i * 0.25} />
      ))}
    </svg>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <polygon points="40,8 47,30 70,30 52,44 58,66 40,52 22,66 28,44 10,30 33,30" strokeWidth="2.5" {...S} fill={G} fillOpacity="0.15" />
    </svg>
  );
}

function Heart() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <path d="M40,65 C25,50 8,40 8,26 C8,16 16,10 26,13 C33,15 37,20 40,25 C43,20 47,15 54,13 C64,10 72,16 72,26 C72,40 55,50 40,65Z" strokeWidth="2.5" {...S} fill={G} fillOpacity="0.1" />
    </svg>
  );
}

function RastaHat() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <circle cx="40" cy="42" r="18" strokeWidth="2.5" {...S} />
      <circle cx="33" cy="40" r="4.5" strokeWidth="2" {...S} />
      <circle cx="47" cy="40" r="4.5" strokeWidth="2" {...S} />
      <line x1="37.5" y1="40" x2="42.5" y2="40" strokeWidth="1.5" {...S} />
      <path d="M34,50 Q40,56 46,50" strokeWidth="2" {...S} />
      <path d="M26,30 Q33,16 40,18 Q47,16 54,30" strokeWidth="2.5" {...S} />
      <line x1="28" y1="24" x2="52" y2="24" strokeWidth="1.5" {...S} opacity="0.5" />
    </svg>
  );
}

function Skull() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <path d="M20,42 C20,24 28,12 40,12 C52,12 60,24 60,42 C60,52 56,56 52,58 L52,66 L28,66 L28,58 C24,56 20,52 20,42Z" strokeWidth="2.5" {...S} />
      <circle cx="32" cy="38" r="5" fill={G} fillOpacity="0.2" strokeWidth="2" {...S} />
      <circle cx="48" cy="38" r="5" fill={G} fillOpacity="0.2" strokeWidth="2" {...S} />
      <line x1="36" y1="66" x2="36" y2="60" strokeWidth="1.5" {...S} />
      <line x1="44" y1="66" x2="44" y2="60" strokeWidth="1.5" {...S} />
      <path d="M36,50 L40,54 L44,50" strokeWidth="2" {...S} />
    </svg>
  );
}

function Flame() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <path d="M40,10 C48,24 62,34 58,52 C55,64 30,66 26,54 C24,44 34,44 37,50 C40,42 28,28 40,10Z" strokeWidth="2.5" {...S} fill={G} fillOpacity="0.1" />
      <path d="M40,30 C44,38 50,44 48,52 C46,58 36,58 35,52 C34,48 38,48 40,30Z" strokeWidth="1.5" {...S} opacity="0.5" />
    </svg>
  );
}

function SquareWave() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <polyline points="4,50 4,20 16,20 16,60 28,60 28,20 40,20 40,60 52,60 52,20 64,20 64,60 76,60 76,30" strokeWidth="2.5" {...S} />
    </svg>
  );
}

function Spiral() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <path d="M40,40 C40,32 48,26 54,34 C60,42 50,52 40,48 C30,44 26,34 34,24 C42,14 58,18 62,36 C66,54 50,66 34,60 C18,54 14,34 26,18" strokeWidth="2.5" {...S} />
      <circle cx="40" cy="40" r="3" fill={G} />
    </svg>
  );
}

function Globe() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <circle cx="40" cy="40" r="26" strokeWidth="2.5" {...S} />
      <ellipse cx="40" cy="40" rx="12" ry="26" strokeWidth="1.5" {...S} />
      <line x1="14" y1="30" x2="66" y2="30" strokeWidth="1.5" {...S} opacity="0.5" />
      <line x1="14" y1="50" x2="66" y2="50" strokeWidth="1.5" {...S} opacity="0.5" />
    </svg>
  );
}

function Guitar() {
  return (
    <svg viewBox="0 0 80 80" className={svgBase}>
      {gradientDef}
      <ellipse cx="30" cy="54" rx="16" ry="14" strokeWidth="2.5" {...S} />
      <circle cx="30" cy="54" r="4" fill={G} fillOpacity="0.3" strokeWidth="1.5" {...S} />
      <line x1="46" y1="46" x2="68" y2="12" strokeWidth="3" {...S} />
      <rect x="64" y="8" width="10" height="8" rx="2" strokeWidth="2" {...S} />
    </svg>
  );
}

const GENRE_MAP: Record<string, () => JSX.Element> = {
  "60s": PeaceSign,
  "70s": Vinyl,
  "80s": Boombox,
  "90s": Equalizer,
  ambient: CloudWave,
  blues: Guitar,
  chillout: SineWave,
  classical: Piano,
  country: CowboyHat,
  electronic: Circuit,
  funk: FunkGroove,
  hiphop: Microphone,
  jazz: Saxophone,
  latin: Maracas,
  metal: Lightning,
  news: Antenna,
  pop: Star,
  "r&b": Heart,
  reggae: RastaHat,
  rock: Skull,
  soul: Flame,
  techno: SquareWave,
  trance: Spiral,
  world: Globe,
};

export function GenreAnimation({ genre }: GenreAnimationProps) {
  const Component = GENRE_MAP[genre.toLowerCase()];
  if (!Component) {
    return (
      <svg viewBox="0 0 80 80" className={svgBase}>
        {gradientDef}
        <circle cx="40" cy="40" r="20" strokeWidth="2.5" {...S} />
      </svg>
    );
  }
  return <Component />;
}

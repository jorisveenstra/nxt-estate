import React from "react";

// Eenvoudige lijn-iconen in de stijl van de site
const Svg: React.FC<{ size: number; color: string; children: React.ReactNode }> = ({ size, color, children }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

type P = { size?: number; color: string };

export const Sun: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <circle cx="24" cy="24" r="8" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
      <line key={a} x1="24" y1="6" x2="24" y2="11" transform={`rotate(${a} 24 24)`} />
    ))}
  </Svg>
);

export const Anchor: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <circle cx="24" cy="9" r="4" />
    <line x1="24" y1="13" x2="24" y2="42" />
    <line x1="16" y1="19" x2="32" y2="19" />
    <path d="M8 28c0 8 7 14 16 14s16-6 16-14" />
  </Svg>
);

export const Flame: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M24 43c-8 0-13-5-13-12 0-8 7-11 8-19 4 3 6 7 6 11 2-2 3-4 3-7 5 4 9 9 9 15 0 7-5 12-13 12z" />
  </Svg>
);

export const Box: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M6 16l18-9 18 9v20l-18 9-18-9z" />
    <path d="M6 16l18 9 18-9M24 25v20" />
  </Svg>
);

export const Lock: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <rect x="10" y="21" width="28" height="21" rx="3" />
    <path d="M16 21v-6a8 8 0 0116 0v6" />
  </Svg>
);

export const Bed: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M5 38V12M5 30h38v8M43 30v-6a5 5 0 00-5-5H22v11" />
    <circle cx="13" cy="23" r="4" />
  </Svg>
);

export const Lighthouse: React.FC<{ size?: number; color: string; light?: number }> = ({ size = 120, color, light = 1 }) => (
  <svg width={size} height={size * 1.4} viewBox="0 0 60 84" fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
    {/* lichtbundels */}
    <path d="M30 14 L4 6 M30 14 L4 22 M30 14 L56 6 M30 14 L56 22" strokeWidth={2} opacity={light} />
    <path d="M24 10h12v8H24z" />
    <path d="M22 18h16M23 18l-3 50h20l-3-50" />
    <path d="M21.5 36h17M20.6 52h18.8" />
    <path d="M27 6l3-3 3 3" />
  </svg>
);

export const Waves: React.FC<{ width: number; color: string; phase: number }> = ({ width, color, phase }) => {
  const line = (y: number, off: number) => {
    let d = `M0 ${y}`;
    for (let x = 0; x <= width; x += 10) {
      d += ` L${x} ${y + Math.sin((x / width) * Math.PI * 4 + phase + off) * 5}`;
    }
    return d;
  };
  return (
    <svg width={width} height={50} viewBox={`0 0 ${width} 50`} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round">
      <path d={line(12, 0)} />
      <path d={line(26, 1.2)} />
      <path d={line(40, 2.4)} />
    </svg>
  );
};

export const House: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M6 22L24 7l18 15" />
    <path d="M10 19v22h28V19" />
    <path d="M20 41V29h8v12" />
  </Svg>
);

export const Briefcase: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <rect x="6" y="15" width="36" height="25" rx="3" />
    <path d="M18 15v-5h12v5M6 26h36" />
  </Svg>
);

export const Leaf: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M10 38C8 20 22 8 40 8c0 18-12 31-30 30z" />
    <path d="M10 38L28 20" />
  </Svg>
);

export const NoFlame: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M24 43c-8 0-13-5-13-12 0-8 7-11 8-19 4 3 6 7 6 11 2-2 3-4 3-7 5 4 9 9 9 15 0 7-5 12-13 12z" />
    <line x1="6" y1="42" x2="42" y2="6" />
  </Svg>
);

export const FloorHeat: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M6 40h36" />
    <path d="M14 33c-3-4 3-6 0-10s3-6 0-10M24 33c-3-4 3-6 0-10s3-6 0-10M34 33c-3-4 3-6 0-10s3-6 0-10" />
  </Svg>
);

export const HeatPump: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <rect x="5" y="9" width="38" height="30" rx="3" />
    <circle cx="20" cy="24" r="9" />
    <path d="M20 15v18M11 24h18M35 16v16" />
  </Svg>
);

export const Tree: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <circle cx="24" cy="18" r="11" />
    <path d="M24 29v13M17 42h14" />
  </Svg>
);

export const Window: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <rect x="8" y="6" width="32" height="36" />
    <path d="M24 6v36M8 24h32" />
  </Svg>
);

export const Key: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <circle cx="15" cy="24" r="8" />
    <path d="M23 24h20M37 24v7M31 24v5" />
  </Svg>
);

// Overheaddeur; `open` 0..1 schuift de deur omhoog
export const GarageDoor: React.FC<P & { open?: number }> = ({ size = 44, color, open = 0 }) => (
  <Svg size={size} color={color}>
    <path d="M5 42V14L24 5l19 9v28" />
    <rect x="11" y={20 + 0} width="26" height={22 * (1 - open)} />
    {[0, 1, 2].map((i) => (
      <line key={i} x1="11" x2="37" y1={20 + 6 + i * 6} y2={20 + 6 + i * 6} opacity={i * 6 + 6 < 22 * (1 - open) ? 1 : 0} />
    ))}
  </Svg>
);

export const Crane: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M14 43V8M8 43h12M14 8h28M14 14L22 8M36 8v10" />
    <rect x="32" y="18" width="8" height="6" />
  </Svg>
);

export const Concrete: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <rect x="6" y="10" width="36" height="28" />
    <path d="M6 24h36M18 10v14M30 24v14" />
  </Svg>
);

export const Calendar: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <rect x="6" y="10" width="36" height="32" rx="3" />
    <path d="M6 19h36M15 5v9M33 5v9" />
  </Svg>
);

export const Pin: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M24 44s-13-13-13-24a13 13 0 0 1 26 0c0 11-13 24-13 24z" />
    <circle cx="24" cy="20" r="5" />
  </Svg>
);

// Bestelbus
export const Van: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M3 34V14h26v20M29 20h8l7 8v6h-15" />
    <circle cx="12" cy="36" r="4" />
    <circle cx="36" cy="36" r="4" />
  </Svg>
);

export const Wrench: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M29 7a10 10 0 0 0-9 13L7 33a4 4 0 0 0 6 6l13-13a10 10 0 0 0 13-9l-6 5-6-2-2-6 6-5" />
  </Svg>
);

export const Clock: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <circle cx="24" cy="24" r="18" />
    <path d="M24 13v11l7 5" />
  </Svg>
);

export const ChartUp: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M6 40h36M10 32l9-9 7 6 14-15M32 14h8v8" />
  </Svg>
);

export const Shield: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M24 5l16 6v12c0 10-7 17-16 20C15 40 8 33 8 23V11z" />
    <path d="M17 24l5 5 9-10" />
  </Svg>
);

export const Eye: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M3 24s8-13 21-13 21 13 21 13-8 13-21 13S3 24 3 24z" />
    <circle cx="24" cy="24" r="6" />
  </Svg>
);

export const Fence: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M8 42V12l4-5 4 5v30M22 42V12l4-5 4 5v30M36 42V12l4-5 4 5v30M4 20h42M4 34h42" />
  </Svg>
);

export const Plane: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M44 6L4 22l14 5 5 15 6-11 11 8z" />
    <path d="M18 27L44 6" />
  </Svg>
);

export const Umbrella: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M4 22a20 16 0 0 1 40 0zM24 22v18a4 4 0 0 1-8 0M24 4v2" />
  </Svg>
);

export const Utensils: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M12 4v14a5 5 0 0 0 10 0V4M17 4v40M34 44V4c-5 3-7 10-7 18h7" />
  </Svg>
);

export const Racket: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <ellipse cx="20" cy="18" rx="13" ry="14" transform="rotate(-35 20 18)" />
    <path d="M29 28l12 13M37 9l4 4" />
    <circle cx="40" cy="8" r="3" />
  </Svg>
);

export const Dumbbell: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M14 24h20M8 14v20M14 10v28M40 14v20M34 10v28M4 20v8M44 20v8" />
  </Svg>
);

export const Check: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <circle cx="24" cy="24" r="19" />
    <path d="M15 24l6 6 12-13" />
  </Svg>
);

export const Wave: React.FC<P> = ({ size = 44, color }) => (
  <Svg size={size} color={color}>
    <path d="M4 20c5-5 9-5 13 0s9 5 14 0 9-5 13 0M4 32c5-5 9-5 13 0s9 5 14 0 9-5 13 0" />
  </Svg>
);

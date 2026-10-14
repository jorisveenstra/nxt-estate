import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "./brand";
import timing from "./timing.json";

export type Word = { t: string; s: number; e: number };
export type Scene = { id: string; start: number; end: number; words: Word[] };
export type HookTiming = { scenes: Scene[]; end: number };

export const getTiming = (body: number, hook: number) => (timing as Record<string, HookTiming>)[`b${body}h${hook}`];

export const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9²+]/g, "");

// Starttijd (sec) van het eerste woord in de scène dat met `text` begint.
export const wordTime = (scene: Scene, text: string, nth = 0): number => {
  const hits = scene.words.filter((w) => norm(w.t).startsWith(norm(text)));
  const hit = hits[Math.min(nth, hits.length - 1)];
  if (!hit) throw new Error(`Woord "${text}" niet gevonden in scène ${scene.id}`);
  return hit.s;
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Het huisje uit het Huisunie-logo
export const HUIS_PAD = "M34.9674 12.3701L4.60059 42.6367V81.8059H65.3205V42.6367L34.9674 12.3701ZM55.9779 74.0484H13.9432V46.9176L34.9674 25.9628L55.9779 46.9176V74.0484Z";
export const Huisje: React.FC<{ size: number; color?: string; style?: React.CSSProperties }> = ({ size, color = colors.sky, style }) => (
  <svg width={size} height={size * 1.15} viewBox="0 8 70 78" style={style}>
    <path d={HUIS_PAD} fill={color} />
  </svg>
);

// Veer die op frame `at` start; geeft 0..1
export const usePop = (at: number, config = { damping: 12, stiffness: 170, mass: 0.8 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config });
};

export const useOut = (at: number, dur = 8) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
};

// Kaart met ronde hoeken, zoals de blokken en knoppen op de site
export const Card: React.FC<{
  at: number;
  outAt?: number;
  bg?: string;
  from?: "left" | "right" | "up" | "down";
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, outAt, bg = colors.white, from = "up", style, children }) => {
  const p = usePop(at);
  const o = useOut(outAt ?? 1e9);
  const dist = 160;
  const dx = from === "left" ? -dist : from === "right" ? dist : 0;
  const dy = from === "up" ? dist : from === "down" ? -dist : 0;
  return (
    <div
      style={{
        background: bg,
        borderRadius: 32,
        overflow: "hidden",
        transform: `translate(${dx * (1 - p) + o * -dx * 1.5}px, ${dy * (1 - p) + o * 60}px) scale(${0.85 + 0.15 * p})`,
        opacity: Math.min(1, p * 1.6) * (1 - o),
        boxShadow: "0 24px 60px rgba(0,24,60,0.35)",
        position: "relative",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Label dat met een kleine stuiter op `at` verschijnt
export const Chip: React.FC<{ at: number; outAt?: number; children: React.ReactNode; dark?: boolean; style?: React.CSSProperties }> = ({
  at,
  outAt,
  children,
  dark,
  style,
}) => {
  const p = usePop(at, { damping: 9, stiffness: 220, mass: 0.6 });
  const o = useOut(outAt ?? 1e9, 6);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: "18px 30px",
        borderRadius: 999,
        background: dark ? colors.navy : colors.white,
        color: dark ? colors.white : colors.navy,
        boxShadow: "0 10px 30px rgba(0,24,60,0.3)",
        fontFamily: fonts.head,
        fontWeight: 700,
        fontSize: 40,
        transform: `scale(${p * (1 - o)}) rotate(${(1 - p) * -8}deg)`,
        transformOrigin: "left center",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Kicker: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = colors.sky }) => (
  <div style={{ fontFamily: fonts.head, fontWeight: 800, fontSize: 30, letterSpacing: 2, textTransform: "uppercase", color }}>{children}</div>
);

// Groen vinkje dat zich uittekent
export const Vinkje: React.FC<{ at: number; size?: number }> = ({ at, size = 64 }) => {
  const frame = useCurrentFrame();
  const p = usePop(at, { damping: 10, stiffness: 220, mass: 0.6 });
  const d = interpolate(frame, [at + 3, at + 12], [0, 1], clamp);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ transform: `scale(${p})`, flexShrink: 0 }}>
      <circle cx={32} cy={32} r={30} fill={colors.green} />
      <path d="M18 33l9 9 19-20" stroke={colors.white} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={50} strokeDashoffset={50 * (1 - d)} />
    </svg>
  );
};

// Streep die over een tekst heen getrokken wordt
export const Streep: React.FC<{ at: number; color?: string }> = ({ at, color = colors.sky }) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [at, at + 9], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return <div style={{ position: "absolute", left: -8, top: "50%", height: 8, borderRadius: 4, width: `calc(${s * 100}% + 16px)`, background: color, transform: "rotate(-3deg)" }} />;
};

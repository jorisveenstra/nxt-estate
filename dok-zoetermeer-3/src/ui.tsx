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

// Afgeronde hoeken met één rechte hoek linksonder, zoals de panelen in de brochure
export const rounded = (r: number): React.CSSProperties => ({ borderRadius: `${r}px ${r}px ${r}px 0` });
// Veer die op frame `at` start; geeft 0..1
export const usePop = (at: number, config = { damping: 12, stiffness: 170, mass: 0.8 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config });
};

export const useOut = (at: number, dur = 8) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [at, at + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
};

// Kaart in huisstijl die op `at` inspringt en op `outAt` wegschuift
export const Card: React.FC<{
  at: number;
  outAt?: number;
  bg?: string;
  cut?: number;
  from?: "left" | "right" | "up" | "down";
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, outAt, bg = colors.paper, cut = 36, from = "up", style, children }) => {
  const p = usePop(at);
  const o = useOut(outAt ?? 1e9);
  const dist = 160;
  const dx = from === "left" ? -dist : from === "right" ? dist : 0;
  const dy = from === "up" ? dist : from === "down" ? -dist : 0;
  return (
    <div
      style={{
        background: bg,
        ...rounded(cut),
        overflow: "hidden",
        transform: `translate(${dx * (1 - p) + o * -dx * 1.5}px, ${dy * (1 - p) + o * 60}px) scale(${0.85 + 0.15 * p})`,
        opacity: Math.min(1, p * 1.6) * (1 - o),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Getal dat optelt naar `to`, beginnend op `at`
export const CountUp: React.FC<{ at: number; from?: number; to: number; dur?: number; style?: React.CSSProperties }> = ({
  at,
  from = 0,
  to,
  dur = 18,
  style,
}) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [at, at + dur], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{Math.round(v)}</span>;
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
        background: dark ? colors.khaki : colors.paper,
        color: dark ? colors.white : colors.ink,
        ...rounded(20),
        fontFamily: fonts.sans,
        fontWeight: 700,
        fontSize: 42,
        transform: `scale(${p * (1 - o)}) rotate(${(1 - p) * -8}deg)`,
        transformOrigin: "left center",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Kicker: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = colors.khaki }) => (
  <div
    style={{
      fontFamily: fonts.sans,
      fontWeight: 800,
      fontSize: 30,
      letterSpacing: 3,
      textTransform: "uppercase",
      color,
    }}
  >
    {children}
  </div>
);

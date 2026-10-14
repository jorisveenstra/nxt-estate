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

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Dunne gouden kaderlijn binnen een kaart, zoals de omlijste foto's in de brochure; tekent zich rondom uit
export const Kader: React.FC<{ at: number; inset?: number; color?: string }> = ({ at, inset = 16, color = colors.gold }) => {
  const frame = useCurrentFrame();
  const p = (a: number) => interpolate(frame, [at + a, at + a + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const line = (style: React.CSSProperties) => <div style={{ position: "absolute", background: color, ...style }} />;
  return (
    <>
      {line({ left: inset, top: inset, height: 2, width: `calc(${p(2) * 100}% - ${inset * 2 * p(2)}px)` })}
      {line({ right: inset, top: inset, width: 2, height: `calc(${p(7) * 100}% - ${inset * 2 * p(7)}px)` })}
      {line({ right: inset, bottom: inset, height: 2, width: `calc(${p(12) * 100}% - ${inset * 2 * p(12)}px)` })}
      {line({ left: inset, bottom: inset, width: 2, height: `calc(${p(17) * 100}% - ${inset * 2 * p(17)}px)` })}
    </>
  );
};

// Zachte schaduw van palmbladeren die over de kaart valt, zoals op de crèmekleurige brochurepagina's
const frond = (len: number, n: number) => {
  const leaves: string[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const x = t * len;
    const y = Math.sin(t * Math.PI * 0.9) * len * 0.08;
    const l = len * 0.32 * Math.sin(t * Math.PI) + 18;
    for (const side of [-1, 1]) {
      const ex = x + l * 0.45;
      const ey = y + side * l;
      leaves.push(`M${x},${y} Q${x + l * 0.35},${y + side * l * 0.45} ${ex},${ey} Q${x + l * 0.15},${y + side * l * 0.45} ${x},${y}Z`);
    }
  }
  return leaves.join(" ");
};
const FROND = frond(900, 22);

export const PalmShadow: React.FC<{ opacity?: number; seed?: number }> = ({ opacity = 0.13, seed = 0 }) => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame / 38 + seed) * 2.2;
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", filter: "blur(7px)", opacity }}
    >
      <g fill={colors.olive}>
        <path d={FROND} transform={`translate(-120 ${80 + seed * 40}) rotate(${24 + sway} 0 0)`} />
        <path d={FROND} transform={`translate(1150 ${-60 + seed * 30}) rotate(${150 - sway} 0 0)`} />
      </g>
    </svg>
  );
};

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

// Kaart in huisstijl die op `at` inspringt en op `outAt` wegschuift
export const Card: React.FC<{
  at: number;
  outAt?: number;
  bg?: string;
  from?: "left" | "right" | "up" | "down";
  kader?: boolean;
  palm?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, outAt, bg = colors.cream, from = "up", kader, palm, style, children }) => {
  const p = usePop(at);
  const o = useOut(outAt ?? 1e9);
  const dist = 160;
  const dx = from === "left" ? -dist : from === "right" ? dist : 0;
  const dy = from === "up" ? dist : from === "down" ? -dist : 0;
  return (
    <div
      style={{
        background: bg,
        overflow: "hidden",
        transform: `translate(${dx * (1 - p) + o * -dx * 1.5}px, ${dy * (1 - p) + o * 60}px) scale(${0.85 + 0.15 * p})`,
        opacity: Math.min(1, p * 1.6) * (1 - o),
        boxShadow: "0 22px 60px rgba(30,24,12,0.35)",
        position: "relative",
        ...style,
      }}
    >
      {palm ? <PalmShadow seed={at % 3} /> : null}
      {kader ? <Kader at={at} /> : null}
      <div style={{ position: "relative" }}>{children}</div>
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
  const v = interpolate(frame, [at, at + dur], [from, to], { ...clamp, easing: Easing.out(Easing.cubic) });
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{Math.round(v).toLocaleString("nl-NL")}</span>;
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
        background: dark ? colors.olive : colors.cream,
        color: dark ? colors.cream : colors.ink,
        boxShadow: "0 10px 30px rgba(30,24,12,0.3)",
        fontFamily: fonts.sans,
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

// Kleine kop in gespatieerde kapitalen, zoals "TAMPAH BAY, SOUTH LOMBOK." in de brochure
export const Kicker: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = colors.olive }) => (
  <div
    style={{
      fontFamily: fonts.sans,
      fontWeight: 600,
      fontSize: 28,
      letterSpacing: 6,
      textTransform: "uppercase",
      color,
    }}
  >
    {children}
  </div>
);

// Woordmerk: TAMPAH breed gespatieerd met BEACH VILLAS eronder
export const Woordmerk: React.FC<{ width?: number; color?: string; at?: number }> = ({ width = 520, color = colors.gold, at }) => {
  const frame = useCurrentFrame();
  const s = width / 520;
  const spread = at === undefined ? 1 : interpolate(frame, [at, at + 24], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const o = at === undefined ? 1 : interpolate(frame, [at, at + 10], [0, 1], clamp);
  return (
    <div style={{ width, textAlign: "center", color, opacity: o }}>
      <div style={{ fontFamily: fonts.sans, fontWeight: 300, fontSize: 92 * s, letterSpacing: (8 + 22 * spread) * s, marginRight: -(8 + 22 * spread) * s, lineHeight: 1 }}>
        TAMPAH
      </div>
      <div style={{ fontFamily: fonts.sans, fontWeight: 500, fontSize: 22 * s, letterSpacing: 13 * s, marginRight: -13 * s, marginTop: 10 * s, opacity: spread }}>
        BEACH VILLAS
      </div>
    </div>
  );
};

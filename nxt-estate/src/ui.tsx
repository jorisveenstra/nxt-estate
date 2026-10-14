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

export const usePop = (at: number, config = { damping: 12, stiffness: 170, mass: 0.8 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config });
};

export const useOut = (at: number, dur = 8) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
};

// Kaart met ronde hoeken en zachte schaduw, zoals de blokken op de site
export const Card: React.FC<{
  at: number;
  outAt?: number;
  bg?: string;
  from?: "left" | "right" | "up" | "down";
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, outAt, bg = colors.cream, from = "up", style, children }) => {
  const p = usePop(at);
  const o = useOut(outAt ?? 1e9);
  const dist = 160;
  const dx = from === "left" ? -dist : from === "right" ? dist : 0;
  const dy = from === "up" ? dist : from === "down" ? -dist : 0;
  return (
    <div
      style={{
        background: bg,
        borderRadius: 36,
        overflow: "hidden",
        transform: `translate(${dx * (1 - p) + o * -dx * 1.5}px, ${dy * (1 - p) + o * 60}px) scale(${0.85 + 0.15 * p})`,
        opacity: Math.min(1, p * 1.6) * (1 - o),
        boxShadow: "0 24px 70px rgba(42,26,36,0.35)",
        position: "relative",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Pil-label met stuiter
export const Chip: React.FC<{ at: number; outAt?: number; children: React.ReactNode; dark?: boolean; pink?: boolean; style?: React.CSSProperties }> = ({
  at,
  outAt,
  children,
  dark,
  pink,
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
        padding: "18px 32px",
        borderRadius: 999,
        background: dark ? colors.plum : pink ? colors.pink : colors.cream,
        color: dark ? colors.cream : colors.plum,
        boxShadow: "0 10px 30px rgba(42,26,36,0.28)",
        fontFamily: fonts.sans,
        fontWeight: 700,
        fontSize: 38,
        transform: `scale(${p * (1 - o)}) rotate(${(1 - p) * -8}deg)`,
        transformOrigin: "left center",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Kleine kop in kapitalen met roze stip, zoals "• GROWTH PARTNERS VOOR VASTGOEDONTWIKKELAARS"
export const Kicker: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = colors.plum }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: fonts.sans, fontWeight: 700, fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color }}>
    <div style={{ width: 14, height: 14, borderRadius: 7, background: colors.pinkDeep }} />
    {children}
  </div>
);

// Cursief woord met roze markering erachter, zoals "sneller uitverkoopt" op de site
export const Mark: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const frame = useCurrentFrame();
  const m = interpolate(frame, [at, at + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <span style={{ position: "relative", display: "inline-block", fontFamily: fonts.serifItalic, fontStyle: "italic" }}>
      <span style={{ position: "absolute", left: -10, right: -10, top: "8%", bottom: "-2%", background: colors.pink, borderRadius: 6, transform: `scaleX(${m})`, transformOrigin: "left" }} />
      <span style={{ position: "relative" }}>{children}</span>
    </span>
  );
};

export const Vinkje: React.FC<{ at: number; size?: number; color?: string }> = ({ at, size = 64, color = colors.green }) => {
  const frame = useCurrentFrame();
  const p = usePop(at, { damping: 10, stiffness: 220, mass: 0.6 });
  const d = interpolate(frame, [at + 3, at + 12], [0, 1], clamp);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ transform: `scale(${p})`, flexShrink: 0 }}>
      <circle cx={32} cy={32} r={30} fill={color} />
      <path d="M18 33l9 9 19-20" stroke={colors.white} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={50} strokeDashoffset={50 * (1 - d)} />
    </svg>
  );
};

export const Kruis: React.FC<{ at: number; size?: number }> = ({ at, size = 64 }) => {
  const p = usePop(at, { damping: 8, stiffness: 240, mass: 0.6 });
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ transform: `scale(${p}) rotate(${(1 - p) * 90}deg)`, flexShrink: 0 }}>
      <circle cx={32} cy={32} r={30} fill={colors.red} />
      <path d="M21 21l22 22M43 21L21 43" stroke={colors.white} strokeWidth={7} strokeLinecap="round" />
    </svg>
  );
};

export const Teller: React.FC<{ at: number; from?: number; to: number; dur?: number }> = ({ at, from = 0, to, dur = 20 }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [at, at + dur], [from, to], { ...clamp, easing: Easing.out(Easing.cubic) });
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(v)}</span>;
};

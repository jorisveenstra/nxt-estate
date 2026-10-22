import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, FONT } from "./brand";
import { Icon } from "./icons";
import timing from "./timing.json";

export type Word = { t: string; s: number; e: number };
export type Scene = { id: string; start: number; end: number; words: Word[] };
export type HookTiming = { scenes: Scene[]; end: number };

export const getTiming = (body: number, hook: number) => (timing as Record<string, HookTiming>)[`b${body}h${hook}`];

export const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9+]/g, "");

// Starttijd (sec) van het eerste woord in de scène dat met `text` begint; zonder treffer het begin van de scène.
export const wordTime = (scene: Scene, text: string | undefined): number => {
  if (!text) return scene.start;
  const hit = scene.words.find((w) => norm(w.t).startsWith(norm(text)));
  return hit ? hit.s : scene.start;
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

// Kleine pill met icoon, zoals de labels op de site
export const Chip: React.FC<{ at: number; outAt: number; icon: string; text: string }> = ({ at, outAt, icon, text }) => {
  const p = usePop(at, { damping: 11, stiffness: 200, mass: 0.6 });
  const o = useOut(outAt, 7);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 30px 16px 20px",
        borderRadius: 999,
        background: colors.cream,
        color: colors.ink,
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: 38,
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        transform: `translateX(${(1 - p) * -420 + o * -600}px)`,
        opacity: Math.min(1, p * 2) * (1 - o),
        alignSelf: "flex-start",
      }}
    >
      <span style={{ background: colors.orange, color: colors.white, width: 60, height: 60, borderRadius: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={34} color={colors.white} />
      </span>
      {text}
    </div>
  );
};

// Groot kengetal met toelichting
export const Stat: React.FC<{ at: number; outAt: number; big: string; small: string }> = ({ at, outAt, big, small }) => {
  const frame = useCurrentFrame();
  const p = usePop(at, { damping: 10, stiffness: 190, mass: 0.7 });
  const o = useOut(outAt, 7);
  const bar = interpolate(frame, [at + 4, at + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        alignSelf: "flex-start",
        background: colors.steel,
        color: colors.white,
        borderRadius: 28,
        padding: "20px 34px 24px",
        fontFamily: FONT,
        boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
        transform: `translateX(${(1 - p) * -520 + o * -700}px) scale(${0.9 + 0.1 * p})`,
        transformOrigin: "left center",
        opacity: Math.min(1, p * 2) * (1 - o),
        maxWidth: 700,
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 104, lineHeight: 1.0, letterSpacing: -2 }}>{big}</div>
      <div style={{ height: 8, width: 150 * bar, background: colors.orange, borderRadius: 4, margin: "10px 0 12px" }} />
      <div style={{ fontWeight: 600, fontSize: 33, lineHeight: 1.25, color: colors.cream }}>{small}</div>
    </div>
  );
};

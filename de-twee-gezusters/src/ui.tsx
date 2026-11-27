import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "./brand";
import { IconName } from "./config";
import timing from "./timing.json";

export type Word = { t: string; s: number; e: number };
export type Scene = { id: string; start: number; end: number; words: Word[] };
export type PartTiming = { scenes: Scene[]; end: number; audio: number };

export const getTiming = (key: string) => (timing as Record<string, PartTiming>)[key];

export const norm = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]/g, "");

// Starttijd van het eerste woord in de scène dat exact (genormaliseerd) gelijk is aan `text`
export const wordTime = (scene: Scene, text: string): number => {
  const hit = scene.words.find((w) => norm(w.t) === norm(text));
  if (!hit) throw new Error(`Woord "${text}" niet gevonden in scène ${scene.id}`);
  return hit.s;
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const usePop = (at: number, config = { damping: 13, stiffness: 180, mass: 0.7 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config });
};

export const useOut = (at: number, dur = 7) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
};

const PATHS: Record<IconName, string> = {
  leaf: "M5 19c8 0 14-6 14-14-8 0-14 6-14 14zm0 0l7-7",
  pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  check: "M4 12.5l5 5L20 6.5",
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  heart: "M12 20s-7.5-4.6-9-9.3C2 7.4 4.3 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.8 1.1-1.7 2.7-2.8 4.7-2.8 3 0 5.3 2.9 4.3 6.2-1.5 4.7-9 9.3-9 9.3z",
  chat: "M4 5h16v11H9l-5 4z",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v5M16 3v5",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L21 21",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  key: "M14.5 9.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zM13.5 12.5L21 20M18 17l2-2",
};

export const Icon: React.FC<{ name: IconName; size?: number; color?: string; draw?: number }> = ({
  name,
  size = 44,
  color = colors.white,
  draw = 1,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path
      d={PATHS[name]}
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - draw}
    />
  </svg>
);

// Label met icoon dat met een veer in beeld komt
export const Chip: React.FC<{ at: number; outAt: number; icon: IconName; text: string; from?: "left" | "right"; style?: React.CSSProperties }> = ({
  at,
  outAt,
  icon,
  text,
  from = "left",
  style,
}) => {
  const frame = useCurrentFrame();
  const p = usePop(at);
  const o = useOut(outAt);
  const draw = interpolate(frame, [at + 4, at + 16], [0, 1], clamp);
  const dx = (from === "left" ? -1 : 1) * 120;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 18,
        padding: "18px 32px 18px 20px",
        borderRadius: 999,
        background: colors.cream,
        color: colors.green,
        boxShadow: "0 12px 34px rgba(10,25,15,0.35)",
        fontFamily: fonts.sans,
        fontWeight: 700,
        fontSize: 42,
        transform: `translateX(${dx * (1 - p) + dx * o}px) scale(${0.9 + 0.1 * p})`,
        opacity: Math.min(1, p * 1.5) * (1 - o),
        ...style,
      }}
    >
      <div style={{ width: 64, height: 64, borderRadius: 32, background: colors.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={38} draw={draw} />
      </div>
      {text}
    </div>
  );
};

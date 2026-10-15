import { Easing, interpolate, useVideoConfig } from "remotion";
import timing from "./timing.json";
import type { Key } from "./config";

export type Word = { t: string; s: number; e: number };
export type Scene = { id: string; start: number; end: number; words: Word[] };
export type VideoTiming = { scenes: Scene[]; end: number; audio: number; knop: string };

export const getTiming = (body: number, hook: number) => (timing as Record<string, VideoTiming>)[`b${body}h${hook}`];

export const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9²+]/g, "");

// Starttijd (sec) van het n-de woord in de scène dat met `text` begint.
export const wordTime = (scene: Scene, key: Key): number => {
  const [text, nth] = typeof key === "string" ? [key, 0] : key;
  const hits = scene.words.filter((w) => norm(w.t).startsWith(norm(text)));
  const hit = hits[Math.min(nth, hits.length - 1)];
  if (!hit) throw new Error(`Woord "${text}" niet gevonden in scène ${scene.id}`);
  return hit.s;
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = Easing.out(Easing.cubic);

export const useF = () => {
  const { fps } = useVideoConfig();
  return (sec: number) => Math.round(sec * fps);
};

// Rustige fade + kleine schuif, geen veer/stuiter
export const appear = (frame: number, at: number, dur = 14, dist = 24) => {
  const p = interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: ease });
  return { opacity: p, transform: `translateY(${(1 - p) * dist}px)` } as const;
};

import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, FONT } from "./brand";

export type Word = { t: string; s: number; e: number };
export type Scene = { id: string; start: number; end: number; words: Word[] };

// Woordparen die nooit over twee ondertitelstukjes of regels verdeeld mogen worden
const SAMEN: [RegExp, RegExp][] = [
  [/^Baraca$/, /^(Village|Capital)\W*$/],
  [/^Tampah$/, /^Bay\W*$/],
  [/^PT$/, /^PMA\W*$/],
  [/^[\d.,]+$/, /^(euro|procent|minuten|minuutjes)\W*$/],
];

type Unit = { t: string; s: number; e: number; words: Word[] };

export const units = (words: Word[]): Unit[] => {
  const uit: Unit[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const n = words[i + 1];
    if (n && SAMEN.some(([a, b]) => a.test(w.t) && b.test(n.t))) {
      uit.push({ t: `${w.t} ${n.t}`, s: w.s, e: n.e, words: [w, n] });
      i++;
    } else {
      uit.push({ t: w.t, s: w.s, e: w.e, words: [w] });
    }
  }
  return uit;
};

type Chunk = { units: Unit[]; s: number; e: number };

export const chunks = (scenes: Scene[]): Chunk[] => {
  const uit: Chunk[] = [];
  for (const sc of scenes) {
    let cur: Unit[] = [];
    const flush = () => {
      if (cur.length) uit.push({ units: cur, s: cur[0].s, e: cur[cur.length - 1].e });
      cur = [];
    };
    for (const u of units(sc.words)) {
      const len = cur.reduce((a, x) => a + x.t.length + 1, 0) + u.t.length;
      if (cur.length && (cur.length >= 3 || len > 19)) flush();
      cur.push(u);
      if (/[.,?!:;]$/.test(u.t)) flush();
    }
    flush();
  }
  return uit;
};

// Ondertitels per woord: korte stukjes, actief woord in goud; geen dichte vlakken achter de tekst
export const Captions: React.FC<{ scenes: Scene[]; offset?: number; until: number }> = ({ scenes, until }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const lijst = chunks(scenes);
  const idx = lijst.findIndex((c, i) => t >= c.s - 0.05 && t < (lijst[i + 1] ? lijst[i + 1].s - 0.05 : Math.min(c.e + 0.6, until)));
  if (idx < 0) return null;
  const c = lijst[idx];
  const pop = interpolate(t - c.s, [-0.05, 0.08], [0.92, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", top: 1235 }}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 70,
          lineHeight: 1.18,
          textAlign: "center",
          maxWidth: 940,
          color: colors.white,
          textShadow: "0 3px 14px rgba(0,0,0,0.75), 0 0 3px rgba(0,0,0,0.9)",
          transform: `scale(${pop})`,
        }}
      >
        {c.units.map((u, i) => {
          const actief = t >= u.s - 0.03;
          return (
            <span key={i} style={{ whiteSpace: "nowrap", color: actief ? colors.white : "rgba(255,255,255,0.72)" }}>
              <span style={{ color: actief && t < u.e + 0.12 ? colors.sand : undefined }}>{u.t}</span>
              {i < c.units.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

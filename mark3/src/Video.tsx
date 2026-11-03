import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY_CLIPS, CALLOUTS, HOOK_CLIPS } from "./config";
import { colors, FONT, FPS, fontFaces } from "./brand";
import timing from "./timing.json";

type W = { t: string; s: number; e: number };
type Scene = { id: string; start: number; end: number; words: W[] };
const T = timing as Record<string, { scenes: Scene[]; end: number }>;
const TAIL = 1.0;
export const getDuration = (key: string) => Math.ceil((T[key].end + TAIL) * FPS);
const MAXCLIP = 7.8;

// Knippen: harde cuts, geen overgangen. Per scène 1+ segmenten van maximaal een clip-lengte.
const plan = (body: number, hook: number, key: string) => {
  const sc = T[key].scenes, total = T[key].end + TAIL, segs: { clip: string; a: number; b: number }[] = [];
  const hc = HOOK_CLIPS[body][hook - 1];
  let prev = "", idx = 0;
  const pick = (list: string[]) => { let c = list[idx % list.length]; idx++; let n = 0; while (c === prev && n++ < list.length) { c = list[idx % list.length]; idx++; } prev = c; return c; };
  sc.forEach((s, i) => {
    const a = i === 0 ? 0 : s.start - 0.05, b = i === sc.length - 1 ? total : sc[i + 1].start - 0.05;
    const n = Math.max(1, Math.ceil((b - a) / MAXCLIP)), len = (b - a) / n;
    for (let k = 0; k < n; k++) {
      const clip = i === 0 && k === 0 ? hc : pick(BODY_CLIPS[body].filter((c) => c !== hc || idx > 1));
      if (i === 0 && k === 0) prev = clip;
      segs.push({ clip, a: a + len * k, b: a + len * (k + 1) });
    }
  });
  return segs;
};

const phrases = (words: W[]) => {
  const out: W[][] = []; let cur: W[] = [];
  words.forEach((w, i) => { cur.push(w); if (cur.length >= 4 || /[.,?!:;]$/.test(w.t) && cur.length >= 2 || i === words.length - 1) { out.push(cur); cur = []; } });
  return out;
};

const Caption: React.FC<{ scenes: Scene[]; accents: string[] }> = ({ scenes, accents }) => {
  const f = useCurrentFrame(), t = f / FPS;
  const all = scenes.flatMap((s) => phrases(s.words));
  const i = all.findIndex((p, k) => t >= p[0].s - 0.05 && t < (all[k + 1]?.[0].s ?? 1e9) - 0.02);
  if (i < 0) return null;
  const p = all[i], pf = (t - p[0].s) * FPS, pop = spring({ frame: Math.max(0, pf), fps: FPS, config: { damping: 14, stiffness: 220 } });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1180, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 92, lineHeight: 1.1,
      textTransform: "uppercase", transform: `scale(${0.92 + 0.08 * pop})`, opacity: Math.min(1, pop * 1.5) }}>
      {p.map((w, k) => {
        const on = t >= w.s - 0.02 && t < w.e + 0.05, acc = accents.includes(w.t.toLowerCase().replace(/[^a-z0-9ëï]/g, ""));
        return <span key={k} style={{ color: on || acc ? (acc ? colors.sky : colors.white) : "rgba(255,255,255,0.82)", marginRight: 22, display: "inline-block",
          textShadow: "0 4px 22px rgba(10,20,40,0.85), 0 0 4px rgba(10,20,40,0.9)", WebkitTextStroke: "0px", transform: on ? "translateY(-4px)" : "none" }}>{w.t.replace(/[.,]$/, "")}</span>;
      })}
    </div>
  );
};

const Chips: React.FC<{ s: Scene }> = ({ s }) => {
  const f = useCurrentFrame(), t = f / FPS, items = CALLOUTS[s.id] ?? [];
  return (
    <div style={{ position: "absolute", left: 56, top: 250, display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
      {items.map((txt, k) => {
        const st = s.start + 0.25 + k * 0.35, p = spring({ frame: Math.max(0, (t - st) * FPS), fps: FPS, config: { damping: 15, stiffness: 160 } });
        const out = interpolate(t, [s.end - 0.3, s.end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        if (t < st || t > s.end) return null;
        return <div key={k} style={{ fontFamily: FONT, fontWeight: 800, fontSize: 46, color: colors.white, background: colors.blue, padding: "14px 28px", borderRadius: 14,
          transform: `translateX(${(1 - p) * -420}px)`, opacity: out, boxShadow: "0 8px 28px rgba(0,0,0,0.35)" }}>{txt}</div>;
      })}
    </div>
  );
};

const Cta: React.FC<{ s: Scene; end: number }> = ({ s, end }) => {
  const f = useCurrentFrame(), t = f / FPS;
  const st = s.start + 1.2; if (t < st) return null;
  const p = spring({ frame: (t - st) * FPS, fps: FPS, config: { damping: 12, stiffness: 140 } });
  const pulse = 1 + 0.03 * Math.sin((t - st) * 6);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1560, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, opacity: p, transform: `translateY(${(1 - p) * 80}px)` }}>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 58, color: colors.white, background: colors.blue, padding: "28px 64px", borderRadius: 24, transform: `scale(${pulse})`, boxShadow: "0 10px 36px rgba(0,0,0,0.4)" }}>Plan een afspraak</div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: colors.white, textShadow: "0 3px 16px rgba(0,0,0,0.8)" }}>mark3.nl · Bedrijfsunits in Breda</div>
    </div>
  );
};

export const Mark3Video: React.FC<{ body: number; hook: number }> = ({ body, hook }) => {
  const key = `b${body}h${hook}`, { scenes, end } = T[key], total = end + TAIL, segs = plan(body, hook, key);
  const f = useCurrentFrame(), t = f / FPS;
  const allWords = scenes.flatMap((s) => s.words);
  const musicVol = (fr: number) => {
    const tt = fr / FPS, speaking = allWords.some((w) => tt >= w.s - 0.1 && tt <= w.e + 0.15);
    const base = interpolate(tt, [0, 1, total - 2, total], [0, 0.13, 0.13, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return speaking ? base * 0.62 : base * 1.25;
  };
  const hookWords = scenes[0].words.map((w) => w.t.toLowerCase().replace(/[^a-z0-9ëï]/g, ""));
  const ACC = ["huur", "eigen", "verhuurder", "vaste", "huurcontract", "bedrijfsactiviteit", "voorraad", "hoogte", "elf", "opslagruimte", "tastbaars", "branche", "ligging", "bouwkwaliteit", "zichtlocatie", "belegger", "nieuwbouw"];
  const accents = hookWords.filter((w) => ACC.includes(w));
  const prog = Math.min(1, t / total);
  return (
    <AbsoluteFill style={{ background: colors.navy }}>
      <style>{fontFaces}</style>
      {segs.map((s, i) => (
        <Sequence key={i} from={Math.round(s.a * FPS)} durationInFrames={Math.max(1, Math.round((s.b - s.a) * FPS))}>
          <OffthreadVideo src={staticFile(`clips/${s.clip}.mp4`)} muted style={{ width: 1080, height: 1920, objectFit: "cover" }} />
        </Sequence>
      ))}
      {/* leesbaarheid: zachte verloop onderaan en bovenaan, footage blijft dominant */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(17,35,55,0.55) 0%, rgba(17,35,55,0) 18%, rgba(17,35,55,0) 52%, rgba(17,35,55,0.72) 100%)" }} />
      <Img src={staticFile("logo/mark3-wit.png")} style={{ position: "absolute", left: 56, top: 80, width: 250, filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.6))" }} />
      <div style={{ position: "absolute", left: 0, top: 0, height: 8, width: `${prog * 100}%`, background: colors.sky }} />
      {scenes.map((s) => (t >= s.start && t < s.end ? <Chips key={s.id} s={s} /> : null))}
      <Caption scenes={scenes} accents={accents} />
      <Cta s={scenes[scenes.length - 1]} end={total} />
      <Audio src={staticFile(`vo/${key}.wav`)} />
      <Audio src={staticFile("muziek/muziek.mp3")} volume={musicVol} />
    </AbsoluteFill>
  );
};

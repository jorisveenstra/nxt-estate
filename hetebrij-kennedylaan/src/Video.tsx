import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, FONT, FPS } from "./brand";
import { BODY, BODY_ACCENT, Chip, Clip, HOOK, Icon } from "./config";
import timing from "./timing.json";

type Word = [number, number, string];
type SceneT = { id: string; text: string; start: number; end: number; words: Word[] };
type BodyT = { frames: number; scenes: SceneT[] };
type HookT = { frames: number; text: string; words: Word[] };
const T = timing as unknown as Record<string, BodyT & HookT>;

const CLIP_LEN = 8; // Veo-clips zijn 8 s
const MAX_SEG = 6.6;
const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9à-ÿ]/g, "");

// ---------- Beeld: full-bleed clips, alleen harde knippen ----------
type Seg = { clip: string; from: number; to: number; start: number };

// Bruikbare lengte per clip (s): daarna wijkt het beeld af van de render (zie scripts/bibliotheek.json)
const USABLE: Record<string, number> = { "groen-avondzon": 1.8, "plattegrond-bg": 3.4, woonkamer: 5.0 };
const FALLBACK: Clip[] = [["hoek-bewoners", 0.3], ["laan-gezinnen", 0.3], ["straat-hoekwoning", 0.4], ["slaapkamer", 0.5]];
const usable = (c: string) => Math.min(USABLE[c] ?? CLIP_LEN - 0.2, CLIP_LEN - 0.2);

const segmentsFor = (scenes: { clips: Clip[]; from: number; to: number }[]): Seg[] => {
  const segs: Seg[] = [];
  for (const sc of scenes) {
    const dur = sc.to - sc.from;
    const pos: Record<string, number> = {};
    const pool = [...sc.clips, ...FALLBACK.filter((f) => !sc.clips.some((c) => c[0] === f[0]))];
    const want = Math.max(sc.clips.length > 1 && dur > 4.2 ? 2 : 1, Math.ceil(dur / MAX_SEG));
    let t = sc.from;
    let k = 0;
    let guard = 0;
    while (sc.to - t > 0.01 && guard++ < 20) {
      const [clip, s0] = pool[k % pool.length];
      k++;
      const start = pos[clip] ?? s0;
      const room = usable(clip) - start;
      if (room < 0.8) continue;
      if (segs.length && segs[segs.length - 1].clip === clip && segs[segs.length - 1].to === t) continue;
      let len = Math.min(room, sc.to - t, Math.max(dur / want, 1.0));
      if (sc.to - t - len < 0.9) len = Math.min(room, sc.to - t); // geen mini-shot aan het eind
      if (sc.to - t - len < 0.9 && sc.to - t - len > 0.01) len = Math.max(0.9, sc.to - t - 0.9);
      segs.push({ clip, start, from: t, to: t + len });
      pos[clip] = start + len;
      t += len;
    }
  }
  return segs;
};

const Footage: React.FC<{ segs: Seg[] }> = ({ segs }) => (
  <AbsoluteFill style={{ backgroundColor: colors.ink }}>
    {segs.map((s, i) => {
      const from = Math.round(s.from * FPS);
      const len = Math.round(s.to * FPS) - from;
      const start = s.start;
      return (
        <Sequence key={i} from={from} durationInFrames={len} layout="none">
          <AbsoluteFill>
            <OffthreadVideo src={staticFile(`clips/${s.clip}.mp4`)} muted startFrom={Math.round(start * FPS)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </AbsoluteFill>
        </Sequence>
      );
    })}
    {/* lichte verloop-vignetten boven/onder voor leesbaarheid (geen balken) */}
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.45) 100%)" }} />
  </AbsoluteFill>
);

// ---------- Iconen ----------
const IconSvg: React.FC<{ name: Icon; size?: number; color?: string }> = ({ name, size = 46, color = colors.white }) => {
  const p = { fill: "none", stroke: color, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<Icon, React.ReactNode> = {
    huis: <><path {...p} d="M3 11 12 4l9 7" /><path {...p} d="M5 10v10h14V10" /><path {...p} d="M10 20v-6h4v6" /></>,
    zon: <><circle {...p} cx="12" cy="12" r="4" /><path {...p} d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    accu: <><rect {...p} x="3" y="7" width="16" height="10" rx="2" /><path {...p} d="M21 10v4M7 12h2M11 12h2" /></>,
    systeem: <><rect {...p} x="4" y="4" width="16" height="16" rx="3" /><path {...p} d="M8 15l3-3 2 2 3-4" /></>,
    bliksem: <path {...p} d="M13 2 4 14h7l-1 8 9-12h-7z" />,
    kalender: <><rect {...p} x="3" y="5" width="18" height="16" rx="2" /><path {...p} d="M3 10h18M8 3v4M16 3v4" /></>,
    pin: <><path {...p} d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" /><circle {...p} cx="12" cy="9" r="2.5" /></>,
    boom: <><path {...p} d="M12 22v-7" /><path {...p} d="M12 3c3.5 0 6 2.6 6 5.6 0 3.2-2.7 5.4-6 5.4s-6-2.2-6-5.4C6 5.6 8.5 3 12 3z" /></>,
    gezin: <><circle {...p} cx="8" cy="7" r="2.5" /><circle {...p} cx="16" cy="9" r="2" /><path {...p} d="M4 20v-4a4 4 0 0 1 8 0v4M13 20v-3a3 3 0 0 1 6 0v3" /></>,
    sleutel: <><circle {...p} cx="7.5" cy="14.5" r="4" /><path {...p} d="M10.5 11.5 20 2M16 6l3 3M14 8l2 2" /></>,
    plattegrond: <><rect {...p} x="3" y="3" width="18" height="18" rx="1" /><path {...p} d="M3 12h8v9M11 3v5M15 12h6" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24">{paths[name]}</svg>;
};

// ---------- Logo + label ----------
const Logo: React.FC = () => (
  <div style={{ position: "absolute", top: 70, left: 56, background: colors.white, borderRadius: 18, padding: "16px 22px",
    boxShadow: "0 6px 24px rgba(0,0,0,0.25)" }}>
    <Img src={staticFile("logo/hetebrij.png")} style={{ width: 340, display: "block" }} />
  </div>
);

const Tag: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 14 });
  return (
    <div style={{ position: "absolute", top: 215, left: 56, transform: `translateX(${(1 - s) * -60}px)`, opacity: s,
      background: colors.red, color: colors.white, fontFamily: FONT, fontWeight: 800, fontSize: 40, letterSpacing: 1,
      textTransform: "uppercase", padding: "12px 22px", borderRadius: 10 }}>
      {text}
    </div>
  );
};

// ---------- Ondertitels per woord ----------
const groupWords = (words: Word[]): Word[][] => {
  const groups: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    const len = cur.reduce((a, x) => a + x[2].length + 1, 0);
    const gap = cur.length ? w[0] - cur[cur.length - 1][1] : 0;
    if (cur.length && (len + w[2].length > 20 || cur.length >= 4 || gap > 0.35)) {
      groups.push(cur);
      cur = [];
    }
    cur.push(w);
    if (/[.,?!:]$/.test(w[2])) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length) groups.push(cur);
  return groups;
};

const Captions: React.FC<{ words: Word[]; accent: string[]; y?: number }> = ({ words, accent, y = 1130 }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const groups = groupWords(words);
  const acc = new Set(accent.map(norm));
  const gi = groups.findIndex((g, i) => t >= g[0][0] - 0.05 && t < (groups[i + 1]?.[0][0] ?? g[g.length - 1][1] + 0.6) - 0.05);
  if (gi < 0) return null;
  const g = groups[gi];
  const appear = interpolate(t - g[0][0], [-0.05, 0.08], [0.85, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: y, left: 60, right: 60, display: "flex", flexWrap: "wrap", justifyContent: "center",
      gap: "6px 18px", transform: `scale(${appear})` }}>
      {g.map((w, i) => {
        const active = t >= w[0] - 0.03;
        const isAcc = acc.has(norm(w[2]));
        return (
          <span key={i} style={{ fontFamily: FONT, fontWeight: 800, fontSize: 84, lineHeight: 1.12, color: colors.white,
            opacity: active ? 1 : 0.8, padding: "0 10px", borderRadius: 10,
            background: isAcc && active ? colors.red : "transparent",
            textShadow: isAcc && active ? "none" : "0 3px 14px rgba(0,0,0,0.75), 0 0 3px rgba(0,0,0,0.9)" }}>
            {w[2].replace(/[,.:;]$/, "")}
          </span>
        );
      })}
    </div>
  );
};

// ---------- Chips (korte feitelijke accenten) ----------
const ChipView: React.FC<{ chip: Chip; index: number }> = ({ chip, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16, stiffness: 160 } });
  return (
    <div style={{ position: "absolute", left: 56, top: 330 + index * 118, display: "flex", alignItems: "center", gap: 18,
      transform: `translateX(${(1 - s) * -520}px)`, background: "rgba(255,255,255,0.96)", borderRadius: 16,
      padding: "14px 28px 14px 16px", boxShadow: "0 8px 26px rgba(0,0,0,0.25)" }}>
      <div style={{ width: 70, height: 70, borderRadius: 12, background: colors.red, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <IconSvg name={chip.icon} />
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 44, color: colors.ink }}>{chip.text}</div>
    </div>
  );
};

const wordStart = (sc: SceneT, at: string) => {
  const w = sc.words.find((x) => norm(x[2]).startsWith(norm(at)));
  return w ? w[0] : sc.start + 0.3;
};

// ---------- Eindkaart (CTA) ----------
const CtaCard: React.FC<{ body: number }> = ({ body }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 16 });
  const pulse = 1 + 0.03 * Math.sin((frame / fps) * Math.PI * 2 * 0.9);
  return (
    <div style={{ position: "absolute", left: 50, right: 50, bottom: 110, transform: `translateY(${(1 - s) * 80}px)`, opacity: s,
      background: colors.white, borderRadius: 26, padding: "34px 40px", boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
      <Img src={staticFile("logo/hetebrij.png")} style={{ width: 430 }} />
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 38, color: colors.grey, textAlign: "center" }}>
        {body === 2 ? "18 woningen · President Kennedylaan" : "18 woningen · President Kennedylaan · Heerenveen"}
      </div>
      <div style={{ transform: `scale(${pulse})`, background: colors.red, color: colors.white, fontFamily: FONT, fontWeight: 800,
        fontSize: 48, padding: "20px 44px", borderRadius: 14 }}>
        Plan een afspraak
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: colors.ink }}>met RMW Makelaars</div>
    </div>
  );
};

// ---------- Composities ----------
export const BodyVideo: React.FC<{ body: number; offset: number }> = ({ body }) => {
  const t = T[`b${body}`];
  const cfg = BODY[body];
  const total = t.frames / FPS;
  const scenes = t.scenes.map((sc, i) => ({
    clips: cfg[sc.id].clips,
    from: i === 0 ? 0 : sc.start - 0.12,
    to: i + 1 < t.scenes.length ? t.scenes[i + 1].start - 0.12 : total,
  }));
  const cta = t.scenes[t.scenes.length - 1];
  const words = t.scenes.flatMap((s) => s.words);
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Footage segs={segmentsFor(scenes)} />
      <Logo />
      {t.scenes.map((sc, i) => {
        const end = (scenes[i].to) * FPS;
        return (cfg[sc.id].chips ?? []).map((c, k) => {
          const from = Math.round(Math.max(scenes[i].from, wordStart(sc, c.at) - 0.1) * FPS);
          return (
            <Sequence key={`${i}-${k}`} from={from} durationInFrames={Math.max(1, Math.round(end) - from)} layout="none">
              <ChipView chip={c} index={k} />
            </Sequence>
          );
        });
      })}
      <Captions words={words} accent={BODY_ACCENT} y={1050} />
      <Sequence from={Math.round((cta.start - 0.12) * FPS)} layout="none">
        <CtaCard body={body} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const HookVideo: React.FC<{ body: number; hook: number }> = ({ body, hook }) => {
  const t = T[`b${body}h${hook}`];
  const cfg = HOOK[body][hook];
  const total = t.frames / FPS;
  const scenes = [{ clips: cfg.clips, from: 0, to: total }];
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Footage segs={segmentsFor(scenes)} />
      <Logo />
      <Tag text={cfg.tag} />
      <Captions words={t.words} accent={cfg.accent} y={1050} />
    </AbsoluteFill>
  );
};

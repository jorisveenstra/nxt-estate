import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig, Img } from "remotion";
import { colors, fonts } from "./brand";
import clipLengths from "./clips.json";
import { HOOK_ACCENT, HOOK_CLIPS, SCENE_CALLOUTS, SCENE_CLIPS } from "./config";
import timingData from "./timing.json";

export type VideoProps = { body: number; hook: number };
type Word = { t: string; s: number; e: number };
type Scene = { id: string; start: number; end: number; words: Word[] };
type Timing = { scenes: Scene[]; end: number };

export const TAIL = 2.2; // seconden na de laatste zin
const norm = (w: string) => w.toLowerCase().replace(/[.,?!:;"'*]/g, "");
export const getTiming = (b: number, h: number) => (timingData as Record<string, Timing>)[`b${b}h${h}`];
const wordTime = (sc: Scene, word: string) => (sc.words.find((w) => norm(w.t) === norm(word)) ?? sc.words[0]).s;

type Segment = { clip: string; from: number; to: number };
const buildSegments = (body: number, hook: number, scenes: Scene[], end: number): Segment[] => {
  const segs: Segment[] = [];
  scenes.forEach((sc, i) => {
    const sceneEnd = i + 1 < scenes.length ? scenes[i + 1].start : end;
    const list = sc.id === "hook" ? HOOK_CLIPS[body][hook] : SCENE_CLIPS[sc.id];
    list.forEach(([clip, word], k) => {
      const from = k === 0 ? (i === 0 ? 0 : sc.start) : wordTime(sc, word!);
      const next = list[k + 1];
      const to = next ? wordTime(sc, next[1]!) : sceneEnd;
      segs.push({ clip, from, to });
    });
  });
  return segs;
};

// Beeldvullend (cover) fragment; alleen rustige camerabeweging binnen één shot, nooit een overgang
const ClipSegment: React.FC<{ seg: Segment; durationInFrames: number }> = ({ seg, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = durationInFrames / fps;
  const len = (clipLengths as Record<string, number>)[seg.clip] - 0.1;
  const rate = Math.min(1, len / dur);
  const drift = interpolate(frame, [0, durationInFrames], [1.0, 1.05], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ transform: `scale(${drift})` }}>
      <OffthreadVideo src={staticFile(`clips/${seg.clip}.mp4`)} muted playbackRate={rate} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

const Icon: React.FC<{ name: string; size?: number }> = ({ name, size = 40 }) => {
  const p: Record<string, React.ReactNode> = {
    pin: <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />,
    water: <path d="M2 14c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5V16c-2 0-2 1.5-4 1.5s-2-1.5-4-1.5-2 1.5-4 1.5-2-1.5-4-1.5-2 1.5-4 1.5zm0-5c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5V11c-2 0-2 1.5-4 1.5s-2-1.5-4-1.5-2 1.5-4 1.5-2-1.5-4-1.5-2 1.5-4 1.5z" />,
    cup: <path d="M4 6h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zm13 1h2a2.5 2.5 0 0 1 0 5h-2zM4 20h13v1.5H4z" />,
    sun: <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM11 1h2v3h-2zm0 19h2v3h-2zM1 11h3v2H1zm19 0h3v2h-3zM4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4zm12.1 12.1 1.4-1.4 2.1 2.1-1.4 1.4zM5.6 19.8l-1.4-1.4 2.1-2.1 1.4 1.4zM17.7 7.7l-1.4-1.4 2.1-2.1 1.4 1.4z" />,
    building: <path d="M4 21V5l8-3v6l8 3v10zm3-12v2h2V9zm0 4v2h2v-2zm0 4v2h2v-2zm6-4v2h2v-2zm0 4v2h2v-2z" />,
    roof: <path d="M12 3 2 12h3v9h14v-9h3z" />,
    people: <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm7 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM9 13c-3 0-6 1.5-6 4v3h12v-3c0-2.5-3-4-6-4zm7 1c-.5 0-1 0-1.500.1 1.100.9 2 2.200 2 3.900v2h5v-2.500c0-2-2.500-3.500-5.500-3.500z" />,
    heart: <path d="M12 21s-8-5.300-8-11a4.500 4.500 0 0 1 8-2.800A4.500 4.500 0 0 1 20 10c0 5.700-8 11-8 11z" />,
    key: <path d="M8 3a6 6 0 0 0-1.700 11.700L4 17v3h3v-2h2v-2h2l1.300-1.300A6 6 0 1 0 8 3zm0 3a1.500 1.500 0 1 1 0 3 1.500 1.500 0 0 1 0-3z" />,
    check: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.500 14.500-4-4 1.400-1.400 2.600 2.600 5.600-5.600 1.400 1.400z" />,
    arrow: <path d="M13 4l8 8-8 8-1.400-1.400L17.200 13H3v-2h14.200l-5.600-5.600z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      {p[name]}
    </svg>
  );
};

// Kleine logo-badge (bruine achtergrond: het logo heeft witte tekst)
const Logo: React.FC<{ width: number }> = ({ width }) => (
  <div style={{ background: "rgba(132,92,60,0.96)", borderRadius: 18, padding: `${width * 0.07}px ${width * 0.1}px`, boxShadow: "0 4px 18px rgba(0,0,0,0.35)" }}>
    <Img src={staticFile("logo/logo.svg")} style={{ width, display: "block" }} />
  </div>
);

// Ondertitels: korte groepjes woorden, het gesproken woord licht op; accentwoorden in goud
const Captions: React.FC<{ scenes: Scene[]; accent: string[] }> = ({ scenes, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const words = scenes.filter((s) => s.id !== "cta").flatMap((s) => s.words);
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w) => {
    cur.push(w);
    if (/[.,?!]$/.test(w.t) || cur.length >= 4 || cur.map((c) => c.t).join(" ").length > 20) {
      chunks.push(cur);
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1].e + 0.6) return null;
  const since = (t - chunk[0].s) * fps;
  const pop = interpolate(since, [0, 4], [0.88, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const acc = new Set(accent.map(norm));
  const inHook = chunk[0].s < scenes[1].start;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1330 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 14, maxWidth: 960, transform: `scale(${pop})`, fontFamily: fonts.sans, fontWeight: 800, fontSize: 62, lineHeight: 1.25, textAlign: "center" }}>
        {chunk.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (chunk[i + 1]?.s ?? w.e + 0.6);
          const isAcc = inHook && acc.has(norm(w.t));
          return (
            <span key={i} style={{ color: active ? colors.ink : isAcc ? colors.gold : colors.white, background: active ? colors.gold : "transparent", padding: "0 12px", borderRadius: active ? 8 : undefined, textShadow: active ? "none" : "0 3px 14px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)" }}>
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Korte accenten (callouts) die op het genoemde woord inschuiven
const Callouts: React.FC<{ scenes: Scene[] }> = ({ scenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const items = scenes.flatMap((sc, i) => {
    const next = scenes[i + 1]?.start ?? sc.end + 1;
    return (SCENE_CALLOUTS[sc.id] ?? []).map((c) => ({ ...c, from: wordTime(sc, c.word) + 0.05, to: Math.min(next - 0.1, wordTime(sc, c.word) + 3.2) }));
  });
  const it = items.find((c) => t >= c.from && t < c.to);
  if (!it) return null;
  const p = spring({ frame: frame - Math.round(it.from * fps), fps, config: { damping: 14, stiffness: 140 } });
  const out = interpolate(t, [it.to - 0.25, it.to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 250, left: 50, opacity: out, transform: `translateX(${(1 - p) * -520}px)`, display: "flex", alignItems: "center", gap: 16, background: "rgba(246,244,239,0.95)", color: colors.brownDark, borderRadius: 60, padding: "16px 34px 16px 18px", fontFamily: fonts.sans, fontWeight: 600, fontSize: 40, boxShadow: "0 6px 24px rgba(0,0,0,0.35)" }}>
      <div style={{ width: 62, height: 62, borderRadius: 31, background: colors.gold, color: colors.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={it.icon} size={38} />
      </div>
      {it.text}
    </div>
  );
};

// Afsluitende call-to-action: knop met pulserende rand en pijl
const Cta: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t0 = Math.round(scene.start * fps);
  const p = spring({ frame: frame - t0, fps, config: { damping: 13, stiffness: 120 } });
  const pulse = 1 + 0.04 * Math.sin((frame - t0) / 5);
  const ring = ((frame - t0) % 45) / 45;
  const arrowY = Math.sin((frame - t0) / 4) * 8;
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 880, textAlign: "center", opacity: p, transform: `translateY(${(1 - p) * 40}px)`, fontFamily: fonts.sans }}>
        <div style={{ color: colors.white, fontWeight: 800, fontSize: 70, lineHeight: 1.15, textShadow: "0 4px 22px rgba(0,0,0,0.85)" }}>
          Jouw tweede <span style={{ color: colors.gold }}>vestiging</span>
          <br />
          aan Het Spaarne?
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1500, display: "flex", flexDirection: "column", alignItems: "center", opacity: p, transform: `translateY(${(1 - p) * 120}px)` }}>
        <div style={{ color: colors.white, fontFamily: fonts.sans, fontWeight: 600, fontSize: 42, textShadow: "0 3px 14px rgba(0,0,0,0.85)", transform: `translateY(${arrowY}px)`, marginBottom: 18 }}>Klik op de knop hieronder ↓</div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: -6, borderRadius: 80, border: `4px solid ${colors.gold}`, opacity: 1 - ring, transform: `scale(${1 + ring * 0.25})` }} />
          <div style={{ transform: `scale(${pulse})`, background: colors.gold, color: colors.ink, fontFamily: fonts.sans, fontWeight: 800, fontSize: 50, padding: "28px 56px", borderRadius: 70, display: "flex", alignItems: "center", gap: 20, boxShadow: "0 10px 34px rgba(0,0,0,0.45)" }}>
            Plan een afspraak
            <Icon name="arrow" size={48} />
          </div>
        </div>
        <div style={{ color: colors.cream, fontFamily: fonts.sans, fontWeight: 500, fontSize: 34, marginTop: 20, textShadow: "0 3px 14px rgba(0,0,0,0.85)" }}>met onze makelaar op de bouw</div>
      </div>
    </>
  );
};

export const getDuration = (body: number, hook: number, fps: number) => Math.ceil((getTiming(body, hook).end + TAIL) * fps);

export const HbcVideo: React.FC<VideoProps> = ({ body, hook }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const timing = getTiming(body, hook);
  const end = timing.end + TAIL;
  const F = (s: number) => Math.round(s * fps);
  const segs = buildSegments(body, hook, timing.scenes, end);
  const cta = timing.scenes.find((s) => s.id === "cta")!;
  const t = frame / fps;
  const isCta = t >= cta.start - 0.1;
  const logoIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const progress = frame / durationInFrames;
  // Muziek: zacht onder de voice-over, iets omhoog na het laatste woord, korte fades
  const musicVol = (f: number) => {
    const ts = f / fps;
    const base = ts < timing.end ? 0.13 : 0.3;
    const up = interpolate(ts, [timing.end, timing.end + 0.8], [0.13, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const fadeIn = interpolate(ts, [0, 1.2], [0, 1], { extrapolateRight: "clamp" });
    const fadeOut = interpolate(ts, [end - 1.6, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (ts < timing.end ? 0.13 : up) * fadeIn * fadeOut + 0 * base;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      {segs.map((seg, i) => (
        <Sequence key={i} from={F(seg.from)} durationInFrames={Math.max(1, F(seg.to) - F(seg.from))}>
          <ClipSegment seg={seg} durationInFrames={Math.max(1, F(seg.to) - F(seg.from))} />
        </Sequence>
      ))}

      {/* Verloop boven en onder voor leesbaarheid (geen overgang, alleen contrast) */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,14,8,0.5) 0%, rgba(20,14,8,0) 20%, rgba(20,14,8,0) 55%, rgba(20,14,8,0.7) 100%)" }} />
      {isCta && <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,14,8,0) 30%, rgba(20,14,8,0.55) 100%)" }} />}

      {/* Voortgangsbalk */}
      <div style={{ position: "absolute", top: 0, left: 0, height: 8, width: `${progress * 100}%`, background: colors.gold }} />

      {/* Klein logo + label */}
      <div style={{ position: "absolute", top: 60, left: 50, opacity: logoIn }}>
        <Logo width={170} />
      </div>
      <div style={{ position: "absolute", top: 76, right: 50, opacity: logoIn, fontFamily: fonts.sans, fontWeight: 800, fontSize: 30, letterSpacing: 2, color: colors.ink, background: colors.gold, padding: "12px 26px", borderRadius: 40, boxShadow: "0 4px 16px rgba(0,0,0,0.35)" }}>
        HORECA TE HUUR
      </div>

      {!isCta && <Callouts scenes={timing.scenes} />}
      {!isCta && <Captions scenes={timing.scenes} accent={HOOK_ACCENT[body][hook]} />}
      <Cta scene={cta} />

      <Audio src={staticFile(`vo/b${body}h${hook}.wav`)} />
      <Audio src={staticFile("muziek/music.mp3")} volume={musicVol} />
    </AbsoluteFill>
  );
};

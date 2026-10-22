import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fontFamily, laadFonts } from "./brand";
import clipLengths from "./clips.json";
import { BODY_SEGMENTS, HOOK_ACCENT, HOOK_CLIP } from "./config";
import timing from "./timing.json";

export type VideoProps = { body: number; hook: number };

type Word = { t: string; s: number; e: number };
type Scene = { id: string; start: number; end: number; words: Word[] };

export const TAIL = 2.2; // seconden na de laatste zin

const getTiming = (body: number, hook: number) => (timing as Record<string, { scenes: Scene[]; end: number }>)[`b${body}h${hook}`];
export const getDuration = (body: number, hook: number, fps: number) => Math.ceil((getTiming(body, hook).end + TAIL) * fps);

type Segment = { clip: string; from: number; to: number };

const buildSegments = (body: number, hook: number, scenes: Scene[], end: number): Segment[] => {
  const start = (id: string) => scenes.find((s) => s.id === id)!.start;
  const nextStart = (id: string) => {
    const i = scenes.findIndex((s) => s.id === id);
    return i + 1 < scenes.length ? scenes[i + 1].start : end;
  };
  const segs: Segment[] = [{ clip: HOOK_CLIP[body][hook], from: 0, to: scenes[1].start }];
  BODY_SEGMENTS[body].forEach(([clip, a, b]) => segs.push({ clip, from: start(a), to: b === "cta" ? end : nextStart(b) }));
  return segs;
};

// Beeldvullend, harde knip: elke clip is één doorlopende opname; alleen een heel rustige drift binnen de opname.
const ClipSegment: React.FC<{ seg: Segment; durationInFrames: number }> = ({ seg, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = durationInFrames / fps;
  const len = (clipLengths as Record<string, number>)[seg.clip] - 0.1;
  const rate = Math.min(1, len / dur);
  const drift = interpolate(frame, [0, durationInFrames], [1, 1.05], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ transform: `scale(${drift})` }}>
      <OffthreadVideo src={staticFile(`clips/${seg.clip}.mp4`)} muted playbackRate={rate} />
    </AbsoluteFill>
  );
};

// ---------- iconen ----------
const Icon: React.FC<{ name: string; size?: number; color?: string }> = ({ name, size = 40, color = colors.green }) => {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "pin":
      return <svg {...p}><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.6" /></svg>;
    case "building":
      return <svg {...p}><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" /></svg>;
    case "flat":
      return <svg {...p}><path d="M3 12 12 4l9 8" /><path d="M5 11v9h14v-9" /><path d="M9 20v-5h6v5" /></svg>;
    case "nostairs":
      return <svg {...p}><path d="M4 20h4v-4h4v-4h4V8h4" /><path d="M3 3l18 18" /></svg>;
    case "cart":
      return <svg {...p}><path d="M3 4h2l2.4 11h10.2L20 7H6.2" /><circle cx="9" cy="19" r="1.4" /><circle cx="17" cy="19" r="1.4" /></svg>;
    case "view":
      return <svg {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "calendar":
      return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
    case "leaf":
      return <svg {...p}><path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15z" /><path d="M5 19c3-5 6-8 10-10" /></svg>;
    case "euro":
      return <svg {...p}><path d="M18 6.5A7 7 0 1 0 18 17.5M4 10h10M4 14h10" /></svg>;
    case "arrow":
      return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    default:
      return null;
  }
};

// ---------- logo en locatie ----------
const Woordmerk: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div style={{ position: "absolute", top: 76, left: 54, opacity, fontFamily, color: colors.cream, textShadow: "0 2px 12px rgba(0,0,0,0.55)" }}>
    <div style={{ fontWeight: 700, fontSize: 40, letterSpacing: 6 }}>PATTISTPARK <span style={{ color: colors.goldLight }}>II</span></div>
    <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 54, height: 3, background: colors.goldLight }} />
      <div style={{ fontWeight: 500, fontSize: 24, letterSpacing: 4 }}>TERNEUZEN · ZEELAND</div>
    </div>
  </div>
);

// ---------- korte feiten-chips per scène (alleen wat het script zegt) ----------
const SCENE_CHIPS_1: Record<string, { icon: string; label: string }[]> = {
  dit: [{ icon: "pin", label: "Terneuzen, Zeeland" }, { icon: "building", label: "Nieuwbouw appartementen" }],
  gelijkvloers: [{ icon: "flat", label: "Helemaal gelijkvloers" }, { icon: "nostairs", label: "Geen trappen in huis" }],
  uitzicht: [{ icon: "cart", label: "Voorzieningen dichtbij" }, { icon: "view", label: "Fantastisch uitzicht" }],
  oplevering: [{ icon: "calendar", label: "Oplevering voorjaar 2027" }],
  zorgeloos: [{ icon: "leaf", label: "Zorgeloos wonen in Zeeland" }],
};

const SCENE_CHIPS_2: Record<string, { icon: string; label: string }[]> = {
  dan: [{ icon: "pin", label: "Terneuzen, Zeeland" }, { icon: "building", label: "Direct aan de Westerschelde" }],
  centrum: [{ icon: "pin", label: "Centrum op loopafstand" }, { icon: "cart", label: "Winkels, terrasjes, haven" }],
  gelijkvloers: [{ icon: "flat", label: "Gelijkvloers" }, { icon: "building", label: "2 slaapkamers, eigen balkon" }],
  uitzicht: [{ icon: "view", label: "Uitzicht over de Westerschelde" }],
  prijs: [{ icon: "euro", label: "Vanaf € 309.950 v.o.n." }],
  verkocht: [{ icon: "building", label: "Meer dan de helft verkocht of in optie" }, { icon: "calendar", label: "Oplevering voorjaar 2027" }],
  regio: [{ icon: "cart", label: "Alle voorzieningen dichtbij" }],
};
const SCENE_CHIPS: Record<number, Record<string, { icon: string; label: string }[]>> = { 1: SCENE_CHIPS_1, 2: SCENE_CHIPS_2 };

const Chip: React.FC<{ icon: string; label: string; index: number; inAt: number; outAt: number }> = ({ icon, label, index, inAt, outAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const a = spring({ frame: frame - Math.round((inAt + index * 0.35) * fps), fps, config: { damping: 16, stiffness: 140 } });
  const out = interpolate(t, [outAt - 0.3, outAt], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 14, alignSelf: "flex-start",
        background: "rgba(248,246,242,0.94)", borderRadius: 999, padding: "14px 30px 14px 20px",
        fontFamily, fontWeight: 600, fontSize: 34, color: colors.greenDark,
        boxShadow: "0 8px 26px rgba(0,0,0,0.28)",
        opacity: Math.min(1, a) * out, transform: `translateX(${(1 - Math.min(1, a)) * -140}px)`,
      }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 26, background: colors.sand, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={32} />
      </div>
      {label}
    </div>
  );
};

const Chips: React.FC<{ body: number; scenes: Scene[]; end: number }> = ({ body, scenes, end }) => (
  <>
    {scenes.map((sc, i) => {
      const chips = SCENE_CHIPS[body][sc.id];
      if (!chips) return null;
      const next = i + 1 < scenes.length ? scenes[i + 1].start : end;
      // 'zorgeloos' blijft tot de CTA staan; elke chip komt kort nadat de scène begint
      return (
        <div key={sc.id} style={{ position: "absolute", left: 54, top: 250, display: "flex", flexDirection: "column", gap: 16 }}>
          {chips.map((c, k) => (
            <Chip key={c.label} icon={c.icon} label={c.label} index={k} inAt={sc.start + 0.15} outAt={next} />
          ))}
        </div>
      );
    })}
  </>
);

// ---------- hook: gouden accentlijn boven de ondertitel ----------
const HookLine: React.FC<{ until: number }> = ({ until }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const w = interpolate(frame, [4, 24], [0, 300], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const o = interpolate(t, [until - 0.3, until], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ position: "absolute", top: 1255, left: "50%", marginLeft: -w / 2, width: w, height: 6, borderRadius: 3, background: colors.goldLight, opacity: o }} />;
};

// ---------- ondertitels: korte groepjes woorden, het gesproken woord licht op ----------
const Captions: React.FC<{ scenes: Scene[]; accent: string[] }> = ({ scenes, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const words = scenes.filter((s) => s.id !== "cta").flatMap((s) => s.words);
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w) => {
    cur.push(w);
    const len = cur.map((c) => c.t).join(" ").length;
    if (/[.,?!:]$/.test(w.t) || cur.length >= 4 || len > 22) {
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
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1300 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 16, rowGap: 6, maxWidth: 960, transform: `scale(${pop})`, fontFamily, fontWeight: 800, fontSize: 66, textAlign: "center" }}>
        {chunk.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (chunk[i + 1]?.s ?? w.e + 0.6);
          const isAccent = accent.includes(w.t);
          return (
            <span
              key={i}
              style={{
                color: active ? colors.greenDark : isAccent ? colors.goldLight : colors.white,
                background: active ? colors.goldLight : "transparent",
                padding: "2px 14px",
                borderRadius: 10,
                textShadow: active ? "none" : "0 3px 16px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)",
              }}
            >
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- afsluiter ----------
const Cta: React.FC<{ scene: Scene; end: number }> = ({ scene, end }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const a = spring({ frame: frame - Math.round(scene.start * fps), fps, config: { damping: 18, stiffness: 120 } });
  const knop = spring({ frame: frame - Math.round((scene.words[Math.min(5, scene.words.length - 1)].s) * fps), fps, config: { damping: 12, stiffness: 140 } });
  const puls = 1 + 0.035 * Math.sin((t - scene.start) * 5);
  const vraagEind = scene.words.find((w) => w.t.endsWith("?"))?.e ?? scene.start + 2;
  const actief = (w: Word) => t >= w.s - 0.03 && t < w.e + 0.1;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 150, opacity: interpolate(a, [0, 1], [0, 1]) }}>
      <div style={{ width: 930, borderRadius: 44, background: "rgba(52,85,65,0.94)", padding: "46px 54px 50px", boxShadow: "0 18px 50px rgba(0,0,0,0.4)", textAlign: "center", fontFamily, transform: `translateY(${(1 - Math.min(1, a)) * 120}px)` }}>
        <div style={{ color: colors.goldLight, fontWeight: 600, fontSize: 28, letterSpacing: 6 }}>PATTISTPARK II · TERNEUZEN</div>
        <div style={{ marginTop: 18, fontWeight: 800, fontSize: 70, lineHeight: 1.1, color: colors.cream }}>
          {scene.words.filter((w) => w.s <= vraagEind).map((w, i) => (
            <span key={i} style={{ color: actief(w) ? colors.goldLight : colors.cream }}>{w.t} </span>
          ))}
        </div>
        <div style={{ marginTop: 14, fontWeight: 500, fontSize: 36, color: colors.sand }}>Alle informatie en een afspraak met onze makelaar</div>
        <div style={{ marginTop: 34, display: "inline-flex", alignItems: "center", gap: 16, background: colors.goldLight, color: colors.greenDark, borderRadius: 999, padding: "24px 52px", fontWeight: 700, fontSize: 44, transform: `scale(${Math.min(1, knop) * puls})`, opacity: Math.min(1, knop) }}>
          Plan een afspraak <Icon name="arrow" size={46} color={colors.greenDark} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Muziek zacht onder de voice-over: ducking op de woorden, korte fades, nooit luider dan de stem
const muziekVolume = (t: number, woorden: Word[], eind: number) => {
  const afstand = woorden.reduce((m, w) => Math.min(m, t < w.s ? w.s - t : t > w.e ? t - w.e : 0), 99);
  const basis = interpolate(afstand, [0, 0.7], [0.1, 0.24], { extrapolateRight: "clamp" });
  const fadeIn = interpolate(t, [0, 1.2], [0, 1], { extrapolateRight: "clamp" });
  const fadeUit = interpolate(t, [eind - 1.6, eind], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return basis * fadeIn * fadeUit;
};

export const PattistparkVideo: React.FC<VideoProps> = ({ body, hook }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    laadFonts();
    Promise.all([400, 500, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px Poppins`))).then(() => continueRender(handle)).catch(() => continueRender(handle));
  }, [handle]);

  const tm = getTiming(body, hook);
  const end = tm.end + TAIL;
  const F = (s: number) => Math.round(s * fps);
  const segs = buildSegments(body, hook, tm.scenes, end);
  const cta = tm.scenes.find((s) => s.id === "cta")!;
  const hookScene = tm.scenes[0];
  const alleWoorden = tm.scenes.flatMap((s) => s.words);
  const logoIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.greenDark }}>
      {segs.map((seg, i) => (
        <Sequence key={i} from={F(seg.from)} durationInFrames={Math.max(1, F(seg.to) - F(seg.from))}>
          <ClipSegment seg={seg} durationInFrames={Math.max(1, F(seg.to) - F(seg.from))} />
        </Sequence>
      ))}

      {/* Verloop boven en onder voor leesbaarheid */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,30,24,0.55) 0%, rgba(20,30,24,0) 20%, rgba(20,30,24,0) 55%, rgba(20,30,24,0.62) 100%)" }} />

      <Woordmerk opacity={logoIn * (frame < F(cta.start) - 6 ? 1 : 0)} />
      <HookLine until={hookScene.end + 0.3} />
      <Chips body={body} scenes={tm.scenes} end={end} />
      <Captions scenes={tm.scenes} accent={HOOK_ACCENT[body][hook]} />
      <Cta scene={cta} end={end} />

      <Audio src={staticFile(`vo/b${body}h${hook}.wav`)} />
      <Audio src={staticFile(end > 44 ? "muziek/muziek-53s.mp3" : "muziek/muziek.mp3")} volume={(f) => muziekVolume(f / fps, alleWoorden, end)} />
    </AbsoluteFill>
  );
};

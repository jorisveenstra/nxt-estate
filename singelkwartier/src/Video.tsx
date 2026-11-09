import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { colors, FONT, fontFaces } from "./brand";
import { ACCENTS, BODY_SLOTS, END_CARD, FPS, HOOK_CLIPS } from "./config";
import timing from "./timing.json";
import clipLen from "./cliplen.json";

type T = { hookEnd: number; words: [number, number, string][] };
const PAUSE = 0.45;
const TAIL = 0.6; // stilte na laatste woord voor eindkaart
const tm = timing as unknown as Record<string, T>;
const bodyStart = (h: number) => tm[`h${h}`].hookEnd + PAUSE;
const voEnd = (h: number) => tm[`h${h}`].words[tm[`h${h}`].words.length - 1][1] + TAIL;
export const getDuration = (h: number) => Math.round((voEnd(h) + END_CARD.dur) * FPS);

const Clip: React.FC<{ clip: string; dur: number; start?: number }> = ({ clip, dur, start = 0 }) => {
  const frame = useCurrentFrame();
  const len = (clipLen as Record<string, number>)[clip] - start - 0.05;
  const rate = Math.min(1, len / dur);
  // rustige doorlopende camera-drift binnen één shot (geen overgang)
  const s = interpolate(frame, [0, dur * FPS], [1.0, 1.05]);
  return (
    <AbsoluteFill style={{ transform: `scale(${s})` }}>
      <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} muted playbackRate={rate} startFrom={Math.round(start * FPS)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

const Captions: React.FC<{ words: [number, number, string][] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  // groepjes van max 4 woorden / tot leesteken
  const groups: [number, number, string][][] = [];
  let cur: [number, number, string][] = [];
  words.forEach((w) => {
    cur.push(w);
    if (cur.length >= 4 || /[.?!:,]$/.test(w[2])) { groups.push(cur); cur = []; }
  });
  if (cur.length) groups.push(cur);
  const g = groups.find((gr, i) => t >= gr[0][0] - 0.05 && t < (groups[i + 1] ? groups[i + 1][0][0] - 0.05 : gr[gr.length - 1][1] + 0.5));
  if (!g) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1230, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 22px", fontFamily: FONT, fontWeight: 800, fontSize: 78, lineHeight: 1.2, textTransform: "uppercase", textAlign: "center" }}>
      {g.map((w, i) => {
        const on = t >= w[0] - 0.02;
        const cur = on && t < w[1] + 0.02;
        return (
          <span key={i} style={{ color: cur ? colors.gold : colors.white, opacity: on ? 1 : 0.35, WebkitTextStroke: "10px rgba(14,26,40,.9)", paintOrder: "stroke fill", textShadow: "0 6px 20px rgba(10,20,30,.7)" }}>{w[2]}</span>
        );
      })}
    </div>
  );
};

const Accent: React.FC<{ a: [number, number, string, string?]; off: number }> = ({ a, off }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f0 = Math.round((a[0] + off) * FPS), f1 = Math.round((a[1] + off) * FPS);
  if (frame < f0 || frame > f1) return null;
  const inn = spring({ frame: frame - f0, fps, config: { damping: 16, stiffness: 120 } });
  const out = interpolate(frame, [f1 - 6, f1], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <div style={{ position: "absolute", left: 60, top: 300, opacity: Math.min(inn, out), transform: `translateX(${(1 - inn) * -60}px)`, fontFamily: FONT, borderLeft: `8px solid ${colors.gold}`, paddingLeft: 24, color: "#fff", textShadow: "0 3px 16px rgba(10,20,30,.95), 0 0 3px rgba(10,20,30,.9)" }}>
      <div style={{ fontWeight: 800, fontSize: 56, lineHeight: 1.15 }}>{a[2]}</div>
      {a[3] && <div style={{ fontWeight: 500, fontSize: 36, marginTop: 6, color: "#fff" }}>{a[3]}</div>}
    </div>
  );
};

const Logo: React.FC = () => (
  <div style={{ position: "absolute", top: 70, right: 60, width: 120, height: 171, borderRadius: 60, overflow: "hidden", boxShadow: "0 6px 24px rgba(0,0,0,.4)" }}>
    <Img src={staticFile("brand/logo.png")} style={{ width: "100%", height: "100%" }} />
  </div>
);

const CtaButton: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - from, fps, config: { damping: 14 } });
  if (frame < from) return null;
  return (
    <div style={{ position: "absolute", left: 120, right: 120, top: 1560, height: 120, borderRadius: 60, background: colors.gold, color: colors.navy, fontFamily: FONT, fontWeight: 800, fontSize: 48, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${p})`, boxShadow: "0 10px 30px rgba(0,0,0,.4)" }}>Schrijf je nu in</div>
  );
};

export const SKVideo: React.FC<{ hook: number }> = ({ hook }) => {
  const off = bodyStart(hook);
  const hookDur = off;
  const end = voEnd(hook);
  const words = tm[`h${hook}`].words;
  return (
    <AbsoluteFill style={{ background: colors.navy }}>
      <style>{fontFaces}</style>
      {HOOK_CLIPS[hook].map((c, i) => {
        const a = Math.round(c.frac[0] * hookDur * FPS), b = Math.round(c.frac[1] * hookDur * FPS);
        return <Sequence key={"h" + i} from={a} durationInFrames={b - a}><Clip clip={c.clip} dur={(b - a) / FPS} /></Sequence>;
      })}
      {BODY_SLOTS.map((s, i) => {
        const a = Math.round((s.from + off) * FPS);
        const b = i === BODY_SLOTS.length - 1 ? Math.round(end * FPS) : Math.round((s.to + off) * FPS);
        return <Sequence key={"b" + i} from={a} durationInFrames={b - a}><Clip clip={s.clip} dur={(b - a) / FPS} start={s.start} /></Sequence>;
      })}
      <Sequence from={0} durationInFrames={Math.round(end * FPS)}>
        <AbsoluteFill style={{ background: "linear-gradient(to top, rgba(10,20,32,.6) 0%, rgba(10,20,32,0) 50%)" }} />
        <Captions words={words} />
        <Logo />
        {ACCENTS.map((a, i) => <Accent key={i} a={a} off={off} />)}
        <CtaButton from={Math.round((41.6 + off + 2.2) * FPS)} />
        <Audio src={staticFile(`vo/h${hook}.wav`)} />
        <Audio src={staticFile("muziek/muziek.mp3")} volume={(f) => {
          const t = f / FPS; const base = 0.1;
          return base * interpolate(t, [0, 1.2, end - 1.5, end], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        }} />
      </Sequence>
      <Sequence from={Math.round(end * FPS)} durationInFrames={Math.round(END_CARD.dur * FPS)}>
        <OffthreadVideo src={staticFile(`clips/${END_CARD.clip}.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Sequence>
    </AbsoluteFill>
  );
};

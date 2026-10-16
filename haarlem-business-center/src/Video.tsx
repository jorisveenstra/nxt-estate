import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, font, FPS } from "./brand";
import { AUDIENCE, BODY_CLIPS, CALLOUTS, CTA_TEXT, HOOK_CLIP } from "./config";
import timing from "./timing.json";

type W = [number, number, string];
const tm = timing as Record<string, any>;
export const TAIL = 2.2;
const F = (s: number) => Math.round(s * FPS);

export const bodyFrames = (b: string) => Math.ceil((tm[b].bodyDur + TAIL) * FPS);
export const hookFrames = (b: string, h: number) => Math.ceil((tm[b].hooks[h].dur + tm.pauze) * FPS);

// ---- bouwstenen ----
const Clip: React.FC<{ name: string; from?: number }> = ({ name, from = 0 }) => (
  <AbsoluteFill>
    <OffthreadVideo src={staticFile(`clips/${name}.mp4`)} muted startFrom={F(from)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </AbsoluteFill>
);

const Shade: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(43,29,18,0.55) 0%, rgba(43,29,18,0) 22%, rgba(43,29,18,0) 52%, rgba(43,29,18,0.7) 100%)" }} />
);

const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 70, left: 60, opacity: o, background: colors.brown, borderRadius: 18, padding: "10px 16px", boxShadow: "0 6px 24px rgba(0,0,0,0.35)" }}>
      <Img src={staticFile("logo/hbc.svg")} style={{ width: 120, height: 87, display: "block" }} />
    </div>
  );
};

const Progress: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top: 0, left: 0, height: 10, width: `${Math.min(100, (frame / total) * 100)}%`, background: colors.gold }} />
  );
};

const Chip: React.FC<{ t: string; s?: string; dur: number; top?: number }> = ({ t, s, dur, top = 250 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inn = spring({ frame, fps, config: { damping: 14, stiffness: 140 } });
  const out = interpolate(frame, [dur - 8, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bar = interpolate(frame, [4, 22], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", top, left: 60, opacity: Math.min(inn, out), transform: `translateX(${(1 - inn) * -80}px)`, fontFamily: font }}>
      <div style={{ background: "rgba(132,92,60,0.94)", borderLeft: `12px solid ${colors.gold}`, borderRadius: 14, padding: "20px 34px 18px 28px", maxWidth: 800, boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>
        <div style={{ fontWeight: 700, fontSize: 58, color: colors.white, lineHeight: 1.05 }}>{t}</div>
        {s && <div style={{ fontWeight: 300, fontSize: 36, color: colors.white, marginTop: 8, lineHeight: 1.15 }}>{s}</div>}
        <div style={{ height: 5, width: `${bar}%`, background: colors.gold, marginTop: 14, borderRadius: 3 }} />
      </div>
    </div>
  );
};

const Captions: React.FC<{ words: W[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const chunks: W[][] = [];
  let cur: W[] = [];
  words.forEach((w) => {
    cur.push(w);
    if (/[.,?!]$/.test(w[2]) || cur.length >= 4 || cur.map((c) => c[2]).join(" ").length > 22) { chunks.push(cur); cur = []; }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0][0] - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0][0] - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1][1] + 0.5) return null;
  const pop = interpolate((t - chunk[0][0]) * FPS, [0, 4], [0.88, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1240 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 14, maxWidth: 960, transform: `scale(${pop})`, fontFamily: font, fontWeight: 700, fontSize: 68, textAlign: "center" }}>
        {chunk.map((w, i) => {
          const active = t >= w[0] - 0.03 && t < (chunk[i + 1]?.[0] ?? w[1] + 0.5);
          return (
            <span key={i} style={{ color: active ? colors.brownDark : colors.white, background: active ? colors.gold : "transparent", padding: "0 14px", borderRadius: 10, textShadow: active ? "none" : "0 3px 14px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)" }}>
              {w[2]}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const CtaCard: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inn = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const pulse = 1 + 0.035 * Math.sin(frame / 5);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 150, fontFamily: font }}>
      <div style={{ opacity: inn, transform: `translateY(${(1 - inn) * 80}px) scale(${pulse})`, background: colors.gold, color: colors.brownDark, fontWeight: 700, fontSize: 60, borderRadius: 60, padding: "28px 64px", boxShadow: "0 12px 34px rgba(0,0,0,0.45)" }}>
        {text} →
      </div>
      <div style={{ opacity: inn, marginTop: 26, color: colors.white, fontWeight: 700, fontSize: 40, textShadow: "0 3px 12px rgba(0,0,0,0.8)" }}>haarlembusinesscenter.nl</div>
    </AbsoluteFill>
  );
};

// ---- compositions ----
export const HookVideo: React.FC<{ b: string; h: number }> = ({ b, h }) => {
  const total = hookFrames(b, h);
  const hk = tm[b].hooks[h];
  return (
    <AbsoluteFill style={{ backgroundColor: colors.brownDark }}>
      <Clip name={HOOK_CLIP[b][h - 1]} />
      <Shade />
      <Progress total={total * 8} />
      <Logo />
      <Sequence from={6} durationInFrames={Math.max(10, total - 12)}>
        <Chip t={AUDIENCE[h - 1]} dur={Math.max(10, total - 12)} />
      </Sequence>
      <Captions words={hk.words} />
    </AbsoluteFill>
  );
};

export const BodyVideo: React.FC<{ b: string }> = ({ b }) => {
  const total = bodyFrames(b);
  const starts: number[] = tm[b].sceneStart;
  const words: W[] = tm[b].body;
  const nScenes = starts.length;
  const bounds = starts.map((s, i) => (i === 0 ? 0 : F(s)));
  return (
    <AbsoluteFill style={{ backgroundColor: colors.brownDark }}>
      {starts.map((_, i) => {
        const from = bounds[i];
        const to = i + 1 < nScenes ? bounds[i + 1] : total;
        const clips = BODY_CLIPS[b][i];
        const per = Math.ceil((to - from) / clips.length);
        return clips.map((c, k) => {
          const f = from + k * per;
          return (
            <Sequence key={`${i}-${k}`} from={f} durationInFrames={Math.max(1, Math.min(per, to - f))}>
              <Clip name={c} />
            </Sequence>
          );
        });
      })}
      <Shade />
      <Progress total={total} />
      <Logo />
      {starts.map((_, i) => {
        const co = CALLOUTS[b][i];
        if (!co) return null;
        const from = bounds[i] + 8;
        const to = (i + 1 < nScenes ? bounds[i + 1] : total) - 4;
        const dur = Math.min(to - from, 120);
        return (
          <Sequence key={`c${i}`} from={from} durationInFrames={dur}>
            <Chip t={co.t} s={co.s} dur={dur} />
          </Sequence>
        );
      })}
      <Captions words={words} />
      <Sequence from={bounds[nScenes - 1]}>
        <CtaCard text={CTA_TEXT[b]} />
      </Sequence>
    </AbsoluteFill>
  );
};

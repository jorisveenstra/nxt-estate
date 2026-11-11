import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "./brand";
import { CHIPS, CTA_BUTTON, HOOK_CLIPS, SCENE_CLIPS } from "./config";
import timing from "./timing.json";

type W = { t: string; s: number; e: number };
const T = timing as Record<string, any>;

const Shot: React.FC<{ clip: string }> = ({ clip }) => (
  <AbsoluteFill style={{ backgroundColor: colors.deep }}>
    {/* Staande 1080x1920-clip, volledig beeld (cover), geen randen */}
    <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </AbsoluteFill>
);

const Logo: React.FC<{ big?: boolean }> = ({ big }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: big ? 150 : 70, left: big ? 190 : 50, opacity: o, background: "rgba(255,255,255,0.94)", borderRadius: 22, padding: big ? "18px 34px" : "8px 18px", boxShadow: "0 6px 24px rgba(0,0,0,.25)" }}>
      <Img src={staticFile("logo/oevers-wit.jpg")} style={{ width: big ? 580 : 250, display: "block", mixBlendMode: "multiply" }} />
    </div>
  );
};

const Captions: React.FC<{ words: W[]; top: number }> = ({ words, top }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const chunks: W[][] = []; let cur: W[] = [];
  words.forEach((w) => { cur.push(w); if (/[.,?!:]$/.test(w.t) || cur.length >= 4 || cur.map((c) => c.t).join(" ").length > 20) { chunks.push(cur); cur = []; } });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.05));
  const ch = idx >= 0 ? chunks[idx] : null;
  if (!ch || t > ch[ch.length - 1].e + 0.5) return null;
  const pop = interpolate((t - ch[0].s) * fps, [0, 4], [0.88, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: top }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 16, maxWidth: 940, transform: `scale(${pop})`, fontFamily: fonts.sans, fontWeight: 800, fontSize: 62, textAlign: "center" }}>
        {ch.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (ch[i + 1]?.s ?? w.e + 0.5);
          return <span key={i} style={{ color: active ? colors.deep : colors.white, background: active ? colors.gold : "transparent", padding: "2px 12px", borderRadius: 8, textShadow: active ? "none" : "0 3px 14px rgba(0,0,0,.8), 0 1px 3px rgba(0,0,0,.9)" }}>{w.t}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

const Chip: React.FC<{ title: string; sub: string; from: number; to: number }> = ({ title, sub, from, to }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const a = from * fps, b = to * fps;
  if (frame < a || frame > b) return null;
  const inn = interpolate(frame, [a, a + 9], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const out = interpolate(frame, [b - 6, b], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <div style={{ position: "absolute", top: 330, left: 50, opacity: Math.min(inn, out), transform: `translateX(${(1 - inn) * -80}px)`, display: "flex", background: "rgba(238,236,230,0.93)", borderRadius: 18, overflow: "hidden", boxShadow: "0 8px 28px rgba(0,0,0,.3)", maxWidth: 900 }}>
      <div style={{ width: 14, background: colors.gold }} />
      <div style={{ padding: "18px 30px" }}>
        <div style={{ fontFamily: fonts.head, fontWeight: 700, fontSize: 52, color: colors.deep, lineHeight: 1.1 }}>{title}</div>
        {sub ? <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 32, color: colors.grey, marginTop: 6 }}>{sub}</div> : null}
      </div>
    </div>
  );
};

// Kleine, steeds zichtbare badge: nog maar 4 woningen beschikbaar
const Badge: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [4, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dot = 0.55 + 0.45 * Math.abs(Math.sin(frame / 9));
  return (
    <div style={{ position: "absolute", top: 82, right: 46, opacity: o, display: "flex", alignItems: "center", gap: 14, background: colors.gold, color: colors.deep, borderRadius: 100, padding: "12px 26px", fontFamily: fonts.sans, fontWeight: 800, fontSize: 34, boxShadow: "0 6px 20px rgba(0,0,0,.28)" }}>
      <div style={{ width: 16, height: 16, borderRadius: 8, background: colors.deep, opacity: dot }} />Nog 4 beschikbaar
    </div>
  );
};

// Groot "4"-accent bij de zin over de laatste vier woningen
const Four: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const a = from * fps, b = to * fps;
  if (frame < a || frame > b) return null;
  const s = interpolate(frame, [a, a + 10], [0.4, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.6)) });
  const o = Math.min(interpolate(frame, [a, a + 6], [0, 1], { extrapolateRight: "clamp" }), interpolate(frame, [b - 6, b], [1, 0], { extrapolateLeft: "clamp" }));
  return (
    <div style={{ position: "absolute", top: 560, right: 60, width: 250, height: 250, borderRadius: 125, background: "rgba(112,140,122,0.92)", border: `8px solid ${colors.gold}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: o, transform: `scale(${s})`, boxShadow: "0 10px 30px rgba(0,0,0,.3)" }}>
      <div style={{ fontFamily: fonts.head, fontWeight: 700, fontSize: 150, lineHeight: 1, color: colors.white }}>4</div>
      <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 28, color: colors.cream }}>woningen</div>
    </div>
  );
};

const Grad: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(30,50,40,.45) 0%, rgba(30,50,40,0) 22%, rgba(30,50,40,0) 55%, rgba(30,50,40,.7) 100%)" }} />
);

export const HookVideo: React.FC<{ id: string }> = ({ id }) => {
  const { durationInFrames } = useVideoConfig(); const words: W[] = T[id].words; const clips = HOOK_CLIPS[id];
  const per = Math.ceil(durationInFrames / clips.length);
  return (
    <AbsoluteFill style={{ backgroundColor: colors.deep }}>
      {clips.map((c, i) => <Sequence key={i} from={i * per} durationInFrames={per}><Shot clip={c} /></Sequence>)}
      <Grad /><Logo /><Badge /><Captions words={words} top={1260} />
      <AccentBar />
    </AbsoluteFill>
  );
};

const AccentBar: React.FC = () => {
  const frame = useCurrentFrame(); const { durationInFrames } = useVideoConfig();
  return <div style={{ position: "absolute", left: 0, bottom: 0, height: 10, width: `${(frame / durationInFrames) * 100}%`, background: colors.gold }} />;
};

export const BodyVideo: React.FC<{ id: string }> = ({ id }) => {
  const frame = useCurrentFrame(); const { fps, durationInFrames } = useVideoConfig();
  const scenes = T[id].scenes as { id: string; start: number; end: number; words: W[] }[];
  const allWords = scenes.flatMap((s) => s.words); const total = durationInFrames / fps;
  const cta = scenes.find((s) => s.id === "cta")!;
  const F = (s: number) => Math.round(s * fps);
  const inCta = frame >= F(cta.start);
  const pulse = 1 + 0.025 * Math.sin(frame / 6);
  const btnIn = interpolate(frame, [F(cta.start) + 20, F(cta.start) + 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ backgroundColor: colors.deep }}>
      {scenes.map((sc, i) => {
        const from = i === 0 ? 0 : F(sc.start); const to = i + 1 < scenes.length ? F(scenes[i + 1].start) : durationInFrames;
        const clips = SCENE_CLIPS[id][sc.id]; const per = Math.ceil((to - from) / clips.length);
        return clips.map((c, k) => (
          <Sequence key={`${sc.id}${k}`} from={from + k * per} durationInFrames={Math.max(1, Math.min(per, to - from - k * per))}><Shot clip={c} /></Sequence>
        ));
      })}
      <Grad />
      {!inCta && <Logo />}
      {!inCta && <Badge />}
      {scenes.filter((s) => s.id === "z1").map((s) => <Four key="four" from={s.start + 0.1} to={s.end + 0.4} />)}
      {scenes.filter((s) => CHIPS[id][s.id]).map((s) => {
        const [title, sub] = CHIPS[id][s.id];
        return <Chip key={s.id} title={title} sub={sub} from={s.start + 0.15} to={Math.min(s.end + 0.3, s.start + 4.5)} />;
      })}
      <Captions words={allWords} top={inCta ? 1020 : 1260} />
      {inCta && <Logo big />}
      {inCta && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1480, display: "flex", flexDirection: "column", alignItems: "center", opacity: btnIn, transform: `translateY(${(1 - btnIn) * 40}px)` }}>
          <div style={{ marginBottom: 26, fontFamily: fonts.head, fontWeight: 700, fontSize: 50, color: colors.white, textShadow: "0 3px 12px rgba(0,0,0,.75)" }}>Nog maar 4 woningen beschikbaar</div>
          <div style={{ transform: `scale(${pulse})`, background: colors.gold, color: colors.deep, fontFamily: fonts.sans, fontWeight: 800, fontSize: 56, padding: "30px 64px", borderRadius: 100, boxShadow: "0 10px 30px rgba(0,0,0,.35)" }}>{CTA_BUTTON[id]} →</div>
          <div style={{ marginTop: 26, fontFamily: fonts.head, fontWeight: 700, fontSize: 46, color: colors.white, textShadow: "0 3px 12px rgba(0,0,0,.7)" }}>wonenindeoevers.nl</div>
        </div>
      )}
      <AccentBar />
    </AbsoluteFill>
  );
};

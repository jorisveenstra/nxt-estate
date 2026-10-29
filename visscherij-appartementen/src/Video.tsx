import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import plans from "./plans.json";

const C = { olive: "#6b7a5b", oliveDark: "#4f5b43", cream: "#f2eee8", sand: "#dcd0be", red: "#b3292e", ink: "#282828", white: "#fafafa" };
const FONT_SERIF = "Gelasio, 'Liberation Serif', serif";
const FONT_SANS = "'Instrument Sans', 'DejaVu Sans', sans-serif";

const fonts = `
@font-face { font-family: 'Gelasio'; src: url('${staticFile("fonts/Gelasio.ttf")}'); font-weight: 400 700; }
@font-face { font-family: 'Instrument Sans'; src: url('${staticFile("fonts/InstrumentSans.ttf")}'); font-weight: 400 700; }
`;

type Shot = { clip: string; from: number; dur: number; ss: number; zoom: number; ax: number };
type Cap = { start: number; end: number; words: [number, number, string][] };
type Call = { start: number; end: number; text: string };

const ShotView: React.FC<{ s: Shot }> = ({ s }) => {
  const f = useCurrentFrame();
  const drift = interpolate(f, [0, s.dur], [0, 1]);
  const scale = s.zoom + (s.zoom > 1 ? 0.04 * drift : 0);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: `${s.ax}% 50%` }}>
        <OffthreadVideo src={staticFile(`clips/${s.clip}.mp4`)} startFrom={Math.round(s.ss * 30)} muted style={{ width: 1080, height: 1920, objectFit: "cover" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Captions: React.FC<{ caps: Cap[]; hookEnd: number }> = ({ caps, hookEnd }) => {
  const t = useCurrentFrame() / 30;
  const cur = caps.find((c) => t >= c.start - 0.05 && t < c.end + 0.25);
  if (!cur) return null;
  const isHook = cur.end <= hookEnd + 0.05;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: isHook ? 1080 : 1360, textAlign: "center", fontFamily: isHook ? FONT_SERIF : FONT_SANS,
      fontWeight: 700, fontSize: isHook ? 96 : 84, lineHeight: 1.12, color: C.white, textShadow: "0 4px 18px rgba(0,0,0,.85), 0 0 5px rgba(0,0,0,.9), 0 2px 2px rgba(0,0,0,.9)" }}>
      {cur.words.map((w, i) => {
        const active = t >= w[0] - 0.02 && t < w[1] + 0.04;
        return <span key={i} style={{ color: active ? C.sand : C.white, display: "inline-block", marginRight: 22, transform: active ? "scale(1.07)" : "none" }}>{w[2]}</span>;
      })}
    </div>
  );
};

const Callout: React.FC<{ c: Call }> = ({ c }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const inn = spring({ frame: f - Math.round(c.start * fps), fps, config: { damping: 14, stiffness: 140 } });
  const out = interpolate(t, [c.end - 0.25, c.end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (t < c.start || t > c.end) return null;
  return (
    <div style={{ position: "absolute", top: 250, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: out, transform: `translateY(${(1 - inn) * -40}px) scale(${0.85 + 0.15 * inn})` }}>
      <div style={{ background: C.cream, color: C.oliveDark, fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 64, padding: "20px 46px", borderRadius: 60, borderLeft: `14px solid ${C.red}`, boxShadow: "0 8px 30px rgba(0,0,0,.3)" }}>{c.text}</div>
    </div>
  );
};

const Cta: React.FC<{ start: number }> = ({ start }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  if (t < start) return null;
  const inn = spring({ frame: f - Math.round(start * 30), fps: 30, config: { damping: 12 } });
  const pulse = 1 + 0.03 * Math.sin((t - start) * 7);
  return (
    <div style={{ position: "absolute", bottom: 150, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translateY(${(1 - inn) * 120}px) scale(${pulse})`, opacity: inn }}>
      <div style={{ background: C.red, color: C.white, fontFamily: FONT_SANS, fontWeight: 700, fontSize: 62, padding: "28px 70px", borderRadius: 70, boxShadow: "0 10px 34px rgba(0,0,0,.4)" }}>Plan een afspraak</div>
    </div>
  );
};

export const Video: React.FC<{ planKey: string }> = ({ planKey }) => {
  const p = (plans as any)[planKey];
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = f / 30;
  const total = durationInFrames / 30;
  const music = interpolate(t, [0, 0.8, total - 2, total], [0, 0.13, 0.13, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <style>{fonts}</style>
      {p.shots.map((s: Shot, i: number) => (
        <Sequence key={i} from={s.from} durationInFrames={s.dur}><ShotView s={s} /></Sequence>
      ))}
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,.28) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 50%, rgba(0,0,0,.6) 100%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, height: 10, width: `${(f / durationInFrames) * 100}%`, background: C.red }} />
      <Img src={staticFile("logo-licht.svg")} style={{ position: "absolute", top: 70, left: 60, width: 260 }} />
      {p.callouts.map((c: Call, i: number) => <Callout key={i} c={c} />)}
      <Captions caps={p.captions} hookEnd={p.hookEnd} />
      <Cta start={p.ctaStart} />
      <Audio src={staticFile(p.audio)} />
      <Audio src={staticFile("music/muziek.mp3")} volume={music} />
    </AbsoluteFill>
  );
};

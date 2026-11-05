import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export type Shot = { src: string; from: number; dur: number; startSec: number };
export type Cap = { text: string; from: number; to: number };
export type Accent = { text: string; from: number; to: number; side: "left" | "right" };
export type SegProps = {
  frames: number; shots: Shot[]; captions: Cap[]; accents: Accent[];
  cta: { from: number; label: string; button: string } | null; hook: boolean;
};

const NAVY = "#112337", BLUE = "#204ce5", TEAL = "#2EBAA5";
const FONT = "InterBrand";
const fontCss = `
@font-face{font-family:${FONT};font-weight:800;src:url(${staticFile("fonts/Inter-ExtraBold.otf")});}
@font-face{font-family:${FONT};font-weight:700;src:url(${staticFile("fonts/Inter-Bold.otf")});}`;

const CaptionView: React.FC<{ c: Cap; hook: boolean }> = ({ c, hook }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - c.from, fps, config: { damping: 18, stiffness: 160 }, durationInFrames: 14 });
  const out = interpolate(f, [c.to - 3, c.to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (f < c.from || f > c.to) return null;
  return (
    <div style={{ position: "absolute", left: 70, right: 70, bottom: hook ? 560 : 430, textAlign: "center",
      fontFamily: FONT, fontWeight: 800, fontSize: hook ? 74 : 54, lineHeight: 1.15, color: "#fff",
      textShadow: "0 4px 18px rgba(0,0,0,.85), 0 0 4px rgba(0,0,0,.9)",
      opacity: out * p, transform: `translateY(${(1 - p) * 30}px)` }}>
      {c.text}
    </div>
  );
};

const AccentView: React.FC<{ a: Accent }> = ({ a }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - a.from, fps, config: { damping: 14, stiffness: 140 }, durationInFrames: 16 });
  const out = interpolate(f, [a.to - 6, a.to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (f < a.from || f > a.to) return null;
  const dir = a.side === "left" ? -1 : 1;
  return (
    <div style={{ position: "absolute", top: 330, [a.side]: 50, opacity: out * p,
      transform: `translateX(${dir * (1 - p) * 160}px) scale(${0.9 + 0.1 * p})`,
      background: `linear-gradient(135deg, ${BLUE}, ${NAVY})`, borderLeft: `10px solid ${TEAL}`,
      padding: "22px 34px", borderRadius: 18, fontFamily: FONT, fontWeight: 800, fontSize: 48, color: "#fff",
      maxWidth: 640, boxShadow: "0 10px 30px rgba(0,0,0,.35)" }}>
      {a.text}
    </div>
  );
};

export const Seg: React.FC<SegProps> = (props) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cta = props.cta;
  const cp = cta ? spring({ frame: f - cta.from, fps, config: { damping: 16 }, durationInFrames: 18 }) : 0;
  const pulse = 1 + 0.03 * Math.sin(f / 5);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <style>{fontCss}</style>
      {props.shots.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.dur}>
          <OffthreadVideo src={staticFile(s.src)} startFrom={Math.round(s.startSec * fps)} muted
            style={{ width: 1080, height: 1920, objectFit: "cover" }} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)" }} />
      <Img src={staticFile("img/logo.png")} style={{ position: "absolute", top: 70, left: 60, width: 300 }} />
      {props.accents.map((a, i) => <AccentView key={i} a={a} />)}
      {props.captions.map((c, i) => <CaptionView key={i} c={c} hook={props.hook} />)}
      {cta && f >= cta.from && (
        <div style={{ position: "absolute", left: 60, right: 60, bottom: 130, opacity: cp, transform: `translateY(${(1 - cp) * 80}px)`,
          background: NAVY, borderRadius: 28, padding: "34px 40px", textAlign: "center", fontFamily: FONT,
          boxShadow: "0 12px 40px rgba(0,0,0,.45)", borderTop: `8px solid ${TEAL}` }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 46, lineHeight: 1.15 }}>{cta.label}</div>
          <div style={{ marginTop: 26, display: "inline-block", transform: `scale(${pulse})`, background: TEAL, color: NAVY,
            fontWeight: 800, fontSize: 48, padding: "22px 54px", borderRadius: 60 }}>{cta.button}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

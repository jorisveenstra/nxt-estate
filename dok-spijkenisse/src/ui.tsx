import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, delayRender, continueRender, spring, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { colors, FONT } from "./brand";

export type W = [number, number, string];
export const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, "");

// Lokale Poppins (geen runtime-fetch van Google Fonts)
export const Fonts: React.FC = () => {
  const [h] = React.useState(() => delayRender("fonts"));
  React.useEffect(() => {
    const faces = [500, 600, 700, 800].map((w) => new FontFace("PoppinsDOK", `url(${staticFile(`fonts/Poppins-${w}.ttf`)})`, { weight: String(w) }));
    Promise.all(faces.map((f) => f.load())).then((l) => { l.forEach((f) => document.fonts.add(f)); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
  return null;
};

// Verdeel [from,to] (sec) in stukken van max 3.6 s; elke knip is een harde cut op een andere clip.
export const chunk = (from: number, to: number, clips: string[], offset = 0) => {
  const n = Math.max(1, Math.ceil((to - from) / 3.6));
  const len = (to - from) / n;
  return Array.from({ length: n }, (_, i) => ({ clip: clips[(i + offset) % clips.length], from: from + i * len, to: from + (i + 1) * len }));
};

export const Shot: React.FC<{ clip: string; frames: number }> = ({ clip, frames }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, frames], [1.0, 1.06], { extrapolateRight: "clamp" }); // rustige camerabeweging binnen één shot
  return (
    <AbsoluteFill style={{ transform: `scale(${s})` }}>
      <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

export const Shots: React.FC<{ list: { clip: string; from: number; to: number }[] }> = ({ list }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {list.map((s, i) => {
        const a = Math.round(s.from * fps), b = Math.round(s.to * fps);
        return <Sequence key={i} from={a} durationInFrames={Math.max(1, b - a)}><Shot clip={s.clip} frames={b - a} /></Sequence>;
      })}
    </>
  );
};

export const Brand: React.FC<{ big?: boolean }> = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f, fps, config: { damping: 14 } });
  const blocks = [colors.sky, colors.green, colors.cream, colors.khaki];
  return (
    <div style={{ position: "absolute", left: 56, top: 72, display: "flex", alignItems: "center", gap: 18, opacity: p, transform: `translateY(${(1 - p) * -20}px)` }}>
      <Img src={staticFile("logo/dok-logo.png")} style={{ width: 176, filter: "brightness(0) invert(1) drop-shadow(0 3px 8px rgba(0,0,0,.45))" }} />
      <div style={{ display: "grid", gridTemplateColumns: "26px 26px", gap: 4 }}>
        {blocks.map((c, i) => <div key={i} style={{ width: 26, height: 26, background: c, borderRadius: 4, transform: `scale(${spring({ frame: f - 6 - i * 4, fps, config: { damping: 10 } })})` }} />)}
      </div>
    </div>
  );
};

const CHIP: Record<string, string> = { green: colors.green, orange: colors.orange, khaki: colors.khaki, navy: colors.navy };

export const ChipPop: React.FC<{ text: string; color?: string; slot: number; at: number; until: number }> = ({ text, color = "navy", slot, at, until }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  if (t < at || t > until + 0.3) return null;
  const p = spring({ frame: f - Math.round(at * fps), fps, config: { damping: 11, stiffness: 160 } });
  const out = interpolate(t, [until, until + 0.3], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 56, top: 250 + slot * 104, opacity: out, transform: `translateX(${(1 - p) * -260}px) scale(${0.9 + 0.1 * p})`, transformOrigin: "left center" }}>
      <div style={{ display: "inline-block", background: CHIP[color], color: color === "orange" || color === "green" ? colors.ink : colors.white, fontFamily: FONT, fontWeight: 700, fontSize: 44, padding: "16px 30px", borderRadius: 22, boxShadow: "0 8px 24px rgba(0,0,0,.35)", maxWidth: 760, lineHeight: 1.15 }}>{text}</div>
    </div>
  );
};

export const StepDots: React.FC<{ at: number; until: number; count: number }> = ({ at, until, count }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  if (t < at || t > until + 0.3) return null;
  const gap = Math.min(1.4, (until - at - 0.5) / count);
  return (
    <div style={{ position: "absolute", left: 56, top: 250, display: "flex", gap: 22, alignItems: "center", opacity: interpolate(t, [until, until + 0.3], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
      {Array.from({ length: count }, (_, i) => {
        const p = spring({ frame: f - Math.round((at + i * gap) * fps), fps, config: { damping: 10 } });
        return <div key={i} style={{ width: 92, height: 92, borderRadius: 46, background: i % 2 ? colors.orange : colors.green, color: colors.ink, fontFamily: FONT, fontWeight: 800, fontSize: 52, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${p})`, boxShadow: "0 8px 24px rgba(0,0,0,.35)" }}>{i + 1}</div>;
      })}
    </div>
  );
};

export const stroke = (px = 9): React.CSSProperties => ({ WebkitTextStroke: `${px}px ${colors.ink}`, paintOrder: "stroke fill", textShadow: "0 6px 18px rgba(0,0,0,.45)" } as React.CSSProperties);

export const Progress: React.FC<{ total: number }> = ({ total }) => {
  const f = useCurrentFrame();
  return <div style={{ position: "absolute", left: 0, bottom: 0, height: 12, width: `${(f / total) * 100}%`, background: colors.green }} />;
};

export const Scrim: React.FC = () => <AbsoluteFill style={{ background: "linear-gradient(to top, rgba(0,0,0,.5) 0%, rgba(0,0,0,0) 34%)" }} />;

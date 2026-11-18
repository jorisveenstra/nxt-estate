import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, Series, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, HEAD, TEXT } from "./brand";
import { loadFonts } from "./fonts";
import planJson from "./plan.json";
import timingJson from "./timing.json";

type Shot = { clip: string; from: number; start: number; frames: number };
type Callout = { start: number; end: number; title: string; sub: string };
type Seg = { type: "hook" | "body"; vo: string; frames: number; shots: Shot[]; tag?: string; callouts?: Callout[]; ctaFrom?: number; buttonFrom?: number };
type Word = { t0: number; t1: number; w: string; s: number };
export const plan = planJson as unknown as { fps: number; segments: Record<string, Seg> };
const timing = timingJson as unknown as Record<string, { duur: number; woorden: Word[]; zinnen: { t0: number; t1: number }[] }>;
const FPS = 30;

// Beeld: altijd volledig vullend (cover), harde cuts tussen shots, geen overgangen.
const Footage: React.FC<{ shots: Shot[] }> = ({ shots }) => (
  <AbsoluteFill style={{ backgroundColor: C.navy }}>
    {shots.map((s, i) => (
      <Sequence key={i} from={s.start} durationInFrames={s.frames} layout="none">
        <AbsoluteFill>
          <OffthreadVideo src={staticFile(`clips/${s.clip}.mp4`)} startFrom={Math.round(s.from * FPS)} muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
      </Sequence>
    ))}
  </AbsoluteFill>
);

const Logo: React.FC<{ big?: boolean }> = ({ big }) => (
  <Img src={staticFile("logo/boxcomplex-logo-wit.png")}
    style={{ position: "absolute", left: big ? 290 : 56, top: big ? 250 : 70, width: big ? 500 : 230,
      filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.55))" }} />
);

// Ondertitels per woord, in groepjes; actief woord oranje.
const chunk = (words: Word[], max: number) => {
  const out: Word[][] = []; let cur: Word[] = [];
  for (const w of words) {
    const len = cur.reduce((a, x) => a + x.w.length + 1, 0) + w.w.length;
    if (cur.length && (len > max || cur[cur.length - 1].s !== w.s || /[.?!]$/.test(cur[cur.length - 1].w))) { out.push(cur); cur = []; }
    cur.push(w);
  }
  if (cur.length) out.push(cur);
  return out;
};

const Captions: React.FC<{ vo: string; size: number; top: number; max: number }> = ({ vo, size, top, max }) => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const groups = chunk(timing[vo].woorden, max);
  const gi = groups.findIndex((g, i) => t >= g[0].t0 - 0.05 && (i === groups.length - 1 || t < groups[i + 1][0].t0 - 0.05));
  if (gi < 0) return null;
  const g = groups[gi]; const lastEnd = g[g.length - 1].t1;
  if (gi === groups.length - 1 && t > lastEnd + 0.6) return null;
  const pop = spring({ frame: frame - Math.round((g[0].t0 - 0.05) * FPS), fps: FPS, config: { damping: 14, mass: 0.5 } });
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top, textAlign: "center", transform: `scale(${0.85 + 0.15 * pop})` }}>
      {g.map((w, i) => {
        const active = t >= w.t0 - 0.03;
        return (
          <span key={i} style={{ fontFamily: HEAD, fontWeight: 800, fontSize: size, lineHeight: 1.08, textTransform: "uppercase",
            color: active && t < w.t1 + 0.12 ? C.orange : C.white, margin: "0 0.13em", display: "inline-block",
            WebkitTextStroke: "3px rgba(10,37,64,0.95)", paintOrder: "stroke fill", textShadow: "0 4px 18px rgba(0,0,0,0.75), 0 0 3px rgba(0,0,0,0.9)" }}>{w.w}</span>
        );
      })}
    </div>
  );
};

const CalloutChip: React.FC<{ c: Callout }> = ({ c }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const inn = spring({ frame, fps, config: { damping: 15, mass: 0.6 } });
  const bar = interpolate(frame, [4, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = interpolate(frame, [c.end - c.start - 6, c.end - c.start], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 56, top: 250, transform: `translateX(${(1 - inn) * -700}px)`, opacity: out, maxWidth: 900 }}>
      <div style={{ background: "rgba(10,37,64,0.88)", borderLeft: `14px solid ${C.orange}`, padding: "18px 30px 18px 26px", borderRadius: 6 }}>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 64, color: C.white, lineHeight: 1, textTransform: "uppercase" }}>{c.title}</div>
        {c.sub ? <div style={{ fontFamily: TEXT, fontWeight: 500, fontSize: 32, color: C.blue, marginTop: 10 }}>{c.sub}</div> : null}
      </div>
      <div style={{ height: 8, width: `${bar * 100}%`, background: C.orange, marginTop: 8, borderRadius: 4 }} />
    </div>
  );
};

const HookTag: React.FC<{ tag: string }> = ({ tag }) => {
  const frame = useCurrentFrame();
  const inn = spring({ frame: frame - 3, fps: FPS, config: { damping: 14 } });
  return (
    <div style={{ position: "absolute", left: 56, top: 250, transform: `scale(${inn})`, transformOrigin: "left center",
      background: C.orange, color: C.white, fontFamily: HEAD, fontWeight: 800, fontSize: 46, padding: "12px 26px", borderRadius: 6, letterSpacing: 1 }}>
      {tag}
    </div>
  );
};

const Button: React.FC = () => {
  const frame = useCurrentFrame();
  const inn = spring({ frame, fps: FPS, config: { damping: 12 } });
  const bob = Math.sin(frame / 6) * 8;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1480, display: "flex", justifyContent: "center", transform: `scale(${inn})` }}>
      <div style={{ background: C.orange, color: C.white, fontFamily: HEAD, fontWeight: 800, fontSize: 56, padding: "22px 44px", borderRadius: 10,
        boxShadow: "0 10px 30px rgba(0,0,0,0.45)", display: "flex", alignItems: "center", gap: 22 }}>
        DOWNLOAD DE BROCHURE
        <span style={{ display: "inline-block", transform: `translateY(${bob}px)`, fontSize: 60 }}>↓</span>
      </div>
    </div>
  );
};

const Progress: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();
  return <div style={{ position: "absolute", left: 0, top: 0, height: 10, width: `${(frame / frames) * 100}%`, background: C.orange }} />;
};

export const Segment: React.FC<{ seg: string; audio?: boolean }> = ({ seg, audio }) => {
  loadFonts();
  const s = plan.segments[seg];
  const cta = s.ctaFrom ?? Infinity;
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.navy }}>
      <Footage shots={s.shots} />
      {s.type === "body" ? <Progress frames={s.frames} /> : null}
      {frame < cta ? <Logo /> : <Logo big />}
      {s.type === "hook" ? (
        <>
          <HookTag tag={s.tag!} />
          <Captions vo={s.vo} size={92} top={1050} max={22} />
        </>
      ) : (
        <>
          {(s.callouts ?? []).map((c, i) => (
            <Sequence key={i} from={c.start} durationInFrames={c.end - c.start} layout="none"><CalloutChip c={c} /></Sequence>
          ))}
          <Captions vo={s.vo} size={74} top={1180} max={22} />
          <Sequence from={s.buttonFrom!} layout="none"><Button /></Sequence>
        </>
      )}
      {audio ? <Audio src={staticFile(`vo/${s.vo}.mp3`)} /> : null}
    </AbsoluteFill>
  );
};

// Volledige video voor bekijken in de Studio (incl. VO en muziek). De eindrender gebeurt per segment + ffmpeg-mix.
export const Full: React.FC<{ body: number; hook: number }> = ({ body, hook }) => {
  const h = plan.segments[`b${body}_h${hook}`]; const b = plan.segments[`b${body}`];
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence durationInFrames={h.frames}><Segment seg={`b${body}_h${hook}`} audio /></Series.Sequence>
        <Series.Sequence durationInFrames={b.frames}><Segment seg={`b${body}`} audio /></Series.Sequence>
      </Series>
      <Audio src={staticFile("muziek/muziekbed.mp3")} volume={0.12} />
    </AbsoluteFill>
  );
};

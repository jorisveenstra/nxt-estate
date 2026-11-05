import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, FONT, FPS } from "./brand";
import clipLengths from "./clips.json";
import { BODY_CALLOUTS, BODY_SHOTS, HOOK_SHOTS, Kind, kindOf, TAIL } from "./config";
import timing from "./timing.json";

type Word = [number, number, string];
type T = { hook: Word[]; hook_end: number; body_start: number; body: Word[]; zin_start: number[]; end: number };
const TM = timing as unknown as Record<string, T>;

export const hookFrames = (b: number, h: number) => Math.ceil(TM[`b${b}h${h}`].body_start * FPS);
// De body is voor alle hooks van een body gelijk: tijden relatief aan het begin van de body
export const bodyTiming = (b: number) => {
  const t = TM[`b${b}h1`];
  return {
    words: t.body.map(([s, e, w]) => ({ s: s - t.body_start, e: e - t.body_start, t: w })),
    starts: t.zin_start.map((s) => s - t.body_start),
    end: t.end - t.body_start,
  };
};
export const bodyFrames = (b: number) => Math.ceil((bodyTiming(b).end + TAIL) * FPS);
export const fullFrames = (b: number, h: number) => hookFrames(b, h) + bodyFrames(b);

type Seg = { clip: string; from: number; to: number }; // seconden, relatief

const Badge: React.FC<{ kind: Kind }> = ({ kind }) => {
  const frame = useCurrentFrame();
  const pop = spring({ frame, fps: FPS, config: { damping: 14, stiffness: 160 } });
  const impressie = kind === "impressie";
  return (
    <div style={{ position: "absolute", top: 86, right: 48, transform: `scale(${0.8 + 0.2 * pop})`, opacity: pop, transformOrigin: "100% 0%", fontFamily: FONT, textAlign: "right" }}>
      <div
        style={{
          display: "inline-flex", alignItems: "center", gap: 12, padding: "12px 24px", borderRadius: 40,
          background: impressie ? "rgba(246,241,231,0.94)" : "rgba(22,32,26,0.62)",
          border: impressie ? `3px dashed ${colors.brick}` : "3px solid rgba(255,255,255,0.7)",
          color: impressie ? colors.brick : colors.white, fontWeight: 800, fontSize: 34, letterSpacing: 3, textTransform: "uppercase",
        }}
      >
        {impressie ? (
          <svg width="34" height="34" viewBox="0 0 24 24" fill={colors.brick}><path d="M12 2l2.2 6.3L21 10l-5.4 3.9L17.5 21 12 17.2 6.5 21l1.9-7.1L3 10l6.8-1.7z" /></svg>
        ) : (
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={colors.white} strokeWidth="2.4"><rect x="3" y="6" width="18" height="13" rx="2.5" /><circle cx="12" cy="12.5" r="3.5" /><path d="M8 6l1.5-2.5h5L16 6" /></svg>
        )}
        {impressie ? "Impressie" : kind === "opname" ? "Echte opname" : "Echte foto"}
      </div>
      {impressie && (
        <div style={{ marginTop: 10, color: colors.white, fontWeight: 700, fontSize: 28, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>Zo kan het worden</div>
      )}
    </div>
  );
};

const ClipSeg: React.FC<{ seg: Seg; frames: number }> = ({ seg, frames }) => {
  const frame = useCurrentFrame();
  const len = (clipLengths as Record<string, number>)[seg.clip] - 0.1;
  const rate = Math.min(1, len / (frames / FPS));
  const kind = kindOf(seg.clip);
  // rustige beweging BINNEN één shot (geen overgang)
  const drift = kind === "opname" ? interpolate(frame, [0, frames], [1.0, 1.06]) : 1;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${drift})` }}>
        <OffthreadVideo src={staticFile(`clips/${seg.clip}.mp4`)} muted playbackRate={rate} style={{ width: 1080, height: 1920, objectFit: "cover" }} />
      </AbsoluteFill>
      <Badge kind={kind} />
    </AbsoluteFill>
  );
};

const F = (s: number) => Math.round(s * FPS);

const Footage: React.FC<{ segs: Seg[] }> = ({ segs }) => (
  <>
    {segs.map((s, i) => (
      <Sequence key={i} from={F(s.from)} durationInFrames={Math.max(1, F(s.to) - F(s.from))}>
        <ClipSeg seg={s} frames={Math.max(1, F(s.to) - F(s.from))} />
      </Sequence>
    ))}
  </>
);

const split = (clips: string[], from: number, to: number): Seg[] =>
  clips.map((clip, i) => ({ clip, from: from + ((to - from) * i) / clips.length, to: from + ((to - from) * (i + 1)) / clips.length }));

// Ondertitels: korte groepjes, gesproken woord licht op
const Captions: React.FC<{ words: { s: number; e: number; t: string }[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const chunks: (typeof words)[] = [];
  let cur: typeof words = [];
  words.forEach((w) => {
    cur.push(w);
    if (/[.,?!:]$/.test(w.t) || cur.length >= 4 || cur.map((c) => c.t).join(" ").length > 20) { chunks.push(cur); cur = []; }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1].e + 0.5) return null;
  const pop = interpolate((t - chunk[0].s) * FPS, [0, 4], [0.88, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 1330 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 14, maxWidth: 960, transform: `scale(${pop})`, fontFamily: FONT, fontWeight: 900, fontSize: 64, textAlign: "center", lineHeight: 1.18 }}>
        {chunk.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (chunk[i + 1]?.s ?? w.e + 0.5);
          return (
            <span key={i} style={{ color: colors.white, background: active ? colors.sage : "transparent", padding: "0 12px", borderRadius: 10, textShadow: active ? "none" : "0 3px 14px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)" }}>{w.t}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Klein adreslabel linksboven
const Tag: React.FC = () => (
  <div style={{ position: "absolute", top: 86, left: 48, fontFamily: FONT, color: colors.white, textShadow: "0 2px 12px rgba(0,0,0,0.75)" }}>
    <div style={{ fontWeight: 900, fontSize: 40, letterSpacing: 1 }}>Karakterplein 13</div>
    <div style={{ fontWeight: 700, fontSize: 26, letterSpacing: 6, textTransform: "uppercase", marginTop: 4, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 36, height: 5, background: colors.sage, display: "inline-block", borderRadius: 3 }} />Rotterdam
    </div>
  </div>
);

const Callout: React.FC<{ text: string; start: number; end: number }> = ({ text, start, end }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t < start + 0.15 || t > Math.min(end - 0.1, start + 3.2)) return null;
  const p = spring({ frame: frame - F(start + 0.15), fps: FPS, config: { damping: 15, stiffness: 150 } });
  return (
    <div style={{ position: "absolute", top: 340, left: 48, transform: `translateX(${(1 - p) * -60}px)`, opacity: p, fontFamily: FONT }}>
      <div style={{ background: "rgba(22,32,26,0.72)", borderLeft: `10px solid ${colors.sage}`, borderRadius: 12, padding: "16px 28px", color: colors.white, fontWeight: 800, fontSize: 48, maxWidth: 760, lineHeight: 1.15 }}>{text}</div>
    </div>
  );
};

const EndCard: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const p = spring({ frame: frame - F(start + 0.3), fps: FPS, config: { damping: 14, stiffness: 120 } });
  const pulse = 1 + 0.025 * Math.sin((frame / FPS) * 5);
  if (frame < F(start + 0.3)) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 150, fontFamily: FONT, opacity: p, transform: `translateY(${(1 - p) * 60}px)` }}>
      <div style={{ background: colors.cream, borderRadius: 28, padding: "26px 40px 30px", width: 900, textAlign: "center", boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}>
        <div style={{ fontWeight: 900, fontSize: 46, color: colors.ink }}>Karakterplein 13 · Rotterdam</div>
        <div style={{ fontWeight: 600, fontSize: 31, color: colors.sageDark, marginTop: 6 }}>Bekijk de impressies en alle informatie</div>
        <div style={{ display: "inline-block", transform: `scale(${pulse})`, marginTop: 20, background: colors.accent, color: colors.ink, fontWeight: 900, fontSize: 40, padding: "18px 44px", borderRadius: 60 }}>Plan een afspraak met de makelaar</div>
      </div>
    </AbsoluteFill>
  );
};

const Shade: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,20,14,0.5) 0%, rgba(10,20,14,0) 20%, rgba(10,20,14,0) 62%, rgba(10,20,14,0.55) 100%)" }} />
);

export const HookPart: React.FC<{ body: number; hook: number }> = ({ body, hook }) => {
  const t = TM[`b${body}h${hook}`];
  const dur = hookFrames(body, hook) / FPS;
  const segs = split(HOOK_SHOTS[body][hook], 0, dur);
  const words = t.hook.map(([s, e, w]) => ({ s, e, t: w }));
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Footage segs={segs} />
      <Shade />
      <Tag />
      <Captions words={words} />
    </AbsoluteFill>
  );
};

export const BodyPart: React.FC<{ body: number }> = ({ body }) => {
  const bt = bodyTiming(body);
  const dur = bodyFrames(body) / FPS;
  const plan = BODY_SHOTS[body];
  const segs = plan.flatMap((clips, i) => split(clips, i === 0 ? 0 : bt.starts[i], i + 1 < plan.length ? bt.starts[i + 1] : dur));
  const ctaStart = bt.starts[plan.length - 1];
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Footage segs={segs} />
      <Shade />
      <Tag />
      {BODY_CALLOUTS[body].map((c, i) => (c ? <Callout key={i} text={c} start={bt.starts[i]} end={i + 1 < plan.length ? bt.starts[i + 1] : dur} /> : null))}
      <Captions words={bt.words} />
      <EndCard start={ctaStart} />
    </AbsoluteFill>
  );
};

// Muziek: zacht, onder de voice-over (ducking), korte fades
export const musicVolume = (spoken: [number, number][], total: number) => (f: number) => {
  const t = f / FPS;
  const speaking = spoken.some(([s, e]) => t >= s - 0.12 && t <= e + 0.25);
  const fade = Math.min(1, t / 1.0, (total - t) / 1.5);
  return Math.max(0, fade) * (speaking ? 0.085 : 0.2);
};

// Volledige video (voor de editor): hook + body + audio. De productie rendert hook en body apart en plakt ze met ffmpeg.
export const FullVideo: React.FC<{ body: number; hook: number }> = ({ body, hook }) => {
  const { durationInFrames } = useVideoConfig();
  const t = TM[`b${body}h${hook}`];
  const spoken: [number, number][] = [...t.hook.map(([s, e]) => [s, e] as [number, number]), ...t.body.map(([s, e]) => [s, e] as [number, number])];
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={hookFrames(body, hook)}><HookPart body={body} hook={hook} /></Sequence>
      <Sequence from={hookFrames(body, hook)} durationInFrames={bodyFrames(body)}><BodyPart body={body} /></Sequence>
      <Audio src={staticFile(`vo/b${body}h${hook}.mp3`)} />
      <Audio src={staticFile("muziek/muziek.mp3")} volume={musicVolume(spoken, durationInFrames / FPS)} />
    </AbsoluteFill>
  );
};

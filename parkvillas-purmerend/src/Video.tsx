import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, Series, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts, FPS } from "./brand";
import { BODY_SEGS, CTA_TEXT, FACTS, HOOK_CLIP } from "./config";
import timing from "./timing.json";

type Word = [number, number, string, number];
const T = timing as unknown as {
  hooks: Record<string, { words: Word[]; audio: number; frames: number }>;
  bodies: Record<string, { words: Word[]; audio: number; starts: number[]; frames: number }>;
  clips: Record<string, number>;
};
const F = (s: number) => Math.round(s * FPS);

// Eén clip, full-bleed (cover), harde knip in en uit. Langere stukken iets trager zodat de clip niet opraakt.
const Clip: React.FC<{ clip: string; offset: number; dur: number }> = ({ clip, offset, dur }) => {
  const len = (T.clips[clip] ?? 8) - offset - 0.1;
  const rate = Math.max(0.8, Math.min(1, len / dur));
  return (
    <AbsoluteFill>
      <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} muted playbackRate={rate} startFrom={F(offset)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

// Ondertitels per woordgroep; het gesproken woord krijgt een oranje markering
const Captions: React.FC<{ words: Word[]; top?: number }> = ({ words, top = 1230 }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w) => {
    cur.push(w);
    const len = cur.map((c) => c[2]).join(" ").length;
    if (/[.,?!:]$/.test(w[2]) || cur.length >= 4 || len > 20) {
      chunks.push(cur);
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0][0] - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0][0] - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1][1] + 0.5) return null;
  const pop = interpolate((t - chunk[0][0]) * FPS, [0, 4], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: top }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 14, rowGap: 6, maxWidth: 940, transform: `scale(${pop})`, fontFamily: fonts.sans, fontWeight: 800, fontSize: 60, lineHeight: 1.15, textAlign: "center" }}>
        {chunk.map((w, i) => {
          const active = t >= w[0] - 0.03 && t < (chunk[i + 1]?.[0] ?? w[1] + 0.5);
          return (
            <span key={i} style={{ color: colors.white, background: active ? colors.orange : "transparent", padding: "0 12px", borderRadius: 4, textShadow: active ? "none" : "0 3px 14px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)" }}>
              {w[2]}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Feitenlabels linksboven: schuiven één voor één in, met oranje accentbalk
const Facts: React.FC<{ items: string[]; dur: number }> = ({ items, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 56, top: 300, display: "flex", flexDirection: "column", gap: 16, opacity: out }}>
      {items.map((txt, i) => {
        const s = spring({ frame: frame - 6 - i * 7, fps, config: { damping: 14, stiffness: 140 } });
        const bar = spring({ frame: frame - 10 - i * 7, fps, config: { damping: 20 } });
        return (
          <div key={i} style={{ transform: `translateX(${(1 - s) * -80}px)`, opacity: s, display: "flex", alignItems: "stretch" }}>
            <div style={{ width: 10, background: colors.orange, transform: `scaleY(${bar})`, transformOrigin: "top" }} />
            <div style={{ background: "rgba(22,23,24,0.72)", color: colors.white, fontFamily: fonts.head, fontWeight: 700, fontSize: 50, padding: "8px 22px 10px", letterSpacing: 0.3 }}>{txt}</div>
          </div>
        );
      })}
    </div>
  );
};

const Logo: React.FC<{ width?: number }> = ({ width = 210 }) => (
  <div style={{ position: "absolute", top: 80, left: 56, filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.55))" }}>
    <Img src={staticFile("logo/djzn-ontwikkeling-wit.png")} style={{ width }} />
  </div>
);

const Shade: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,10,10,0.5) 0%, rgba(10,10,10,0) 24%, rgba(10,10,10,0) 55%, rgba(10,10,10,0.55) 100%)" }} />
);

// Hook-segment: clip, projecttitel, ondertitels
export const HookSegment: React.FC<{ id: string }> = ({ id }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const h = T.hooks[id];
  const [clip, off] = HOOK_CLIP[id];
  const tag = spring({ frame: frame - 3, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ background: colors.ink }}>
      <Clip clip={clip} offset={off} dur={h.frames / FPS} />
      <Shade />
      <Logo />
      <div style={{ position: "absolute", left: 56, top: 300, transform: `translateY(${(1 - tag) * 30}px)`, opacity: tag }}>
        <div style={{ fontFamily: fonts.head, fontWeight: 700, fontSize: 76, color: colors.white, textShadow: "0 3px 16px rgba(0,0,0,0.6)" }}>Parkvilla’s Purmerend</div>
        <div style={{ height: 8, width: 220 * tag, background: colors.orange, marginTop: 6 }} />
        <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 34, color: colors.white, marginTop: 14, letterSpacing: 2, textTransform: "uppercase", textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>Aan Park De Noord</div>
      </div>
      <Captions words={h.words} />
    </AbsoluteFill>
  );
};

const CtaCard: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 15 } });
  const pulse = 1 + 0.035 * Math.sin((frame / fps) * Math.PI * 2 * 1.1);
  const arrow = Math.sin((frame / fps) * Math.PI * 2) * 10;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, display: "flex", flexDirection: "column", alignItems: "center", opacity: s, transform: `translateY(${(1 - s) * 60}px)` }}>
      <div style={{ fontFamily: fonts.head, fontWeight: 700, fontSize: 72, color: colors.white, textShadow: "0 3px 16px rgba(0,0,0,0.6)" }}>Parkvilla’s Purmerend</div>
      <div style={{ marginTop: 22, transform: `scale(${pulse})`, background: colors.orange, color: colors.white, fontFamily: fonts.sans, fontWeight: 800, fontSize: 40, padding: "22px 40px", borderRadius: 6, boxShadow: "0 8px 30px rgba(0,0,0,0.35)" }}>
        {CTA_TEXT} <span style={{ display: "inline-block", transform: `translateY(${arrow}px)` }}>↓</span>
      </div>
    </div>
  );
};

// Body-segment (body + CTA), tijden relatief aan het begin van de body
export const BodySegment: React.FC<{ id: string }> = ({ id }) => {
  const b = T.bodies[id];
  const end = b.frames / FPS;
  const wordsOf = (z: number) => b.words.filter((w) => w[3] === z);
  const at = (z: number, wi: number) => (z === 0 && wi === 0 ? 0 : wordsOf(z)[wi][0]);
  const segs = BODY_SEGS[id];
  const ctaIdx = b.starts.length - 1;
  const ctaStart = b.starts[ctaIdx];
  return (
    <AbsoluteFill style={{ background: colors.ink }}>
      {segs.map(([z, wi, clip, off], i) => {
        const from = at(z, wi);
        const to = i + 1 < segs.length ? at(segs[i + 1][0], segs[i + 1][1]) : end;
        return (
          <Sequence key={i} from={F(from)} durationInFrames={F(to) - F(from)}>
            <Clip clip={clip} offset={off ?? 0} dur={to - from} />
          </Sequence>
        );
      })}
      <Shade />
      <Logo />
      {Object.entries(FACTS[id]).map(([z, items]) => {
        const zi = Number(z);
        const from = b.starts[zi];
        const to = b.starts[zi + 1] ?? end;
        return (
          <Sequence key={z} from={F(from)} durationInFrames={F(to) - F(from)} layout="none">
            <Facts items={items} dur={F(to) - F(from)} />
          </Sequence>
        );
      })}
      <Captions words={b.words} top={1160} />
      <Sequence from={F(ctaStart)} layout="none">
        <CtaCard dur={F(end - ctaStart)} />
      </Sequence>
    </AbsoluteFill>
  );
};

// Volledige video voor Studio-preview (render gaat per segment, zie scripts/render.py)
export const FullVideo: React.FC<{ body: number; hook: number }> = ({ body, hook }) => {
  const hid = `b${body}h${hook}`;
  const bid = `b${body}`;
  const hf = T.hooks[hid].frames;
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence durationInFrames={hf}><HookSegment id={hid} /></Series.Sequence>
        <Series.Sequence durationInFrames={T.bodies[bid].frames}><BodySegment id={bid} /></Series.Sequence>
      </Series>
      <Audio src={staticFile(`vo/hook-${hid}.mp3`)} />
      <Sequence from={hf}><Audio src={staticFile(`vo/body-${bid}.mp3`)} /></Sequence>
      <Audio src={staticFile("muziek/muziek.mp3")} volume={0.12} />
    </AbsoluteFill>
  );
};

export const T_ = T;

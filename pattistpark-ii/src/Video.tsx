import React from "react";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BRAND, FONT, FPS, TAIL } from "./brand";
import { BODY, HOOKS } from "./plan";
import timing from "./timing.json";
import { Badge, Captions, CtaButton, Logo, Progress, Sparkles, W } from "./ui";

type T = { woorden: W[]; hookEind: number; bodyStart: number; zinnen: [number, number][]; duur: number };
const get = (b: number, h: number) => (timing as unknown as Record<string, T>)[`b${b}h${h}`];

export const hookFrames = (b: number) => Math.round(get(b, 1).bodyStart * FPS);
export const bodyFrames = (b: number) => Math.ceil((get(b, 1).duur - get(b, 1).bodyStart + TAIL) * FPS);
export const fullFrames = (b: number, h: number) => Math.round(get(b, h).bodyStart * FPS) + bodyFrames(b);

const Shot: React.FC<{ id: string; len: number }> = ({ id, len }) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, len], [1.0, 1.07]);
  return (
    <AbsoluteFill style={{ background: BRAND.navy }}>
      <OffthreadVideo src={staticFile(`clips/${id}.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})` }} />
    </AbsoluteFill>
  );
};

// Harde sneden, nooit langer dan de 8 s van een clip.
const Shots: React.FC<{ clips: string[]; len: number }> = ({ clips, len }) => {
  const n = Math.max(clips.length === 1 ? Math.ceil(len / (7.5 * FPS)) : clips.length, Math.ceil(len / (7.5 * FPS)));
  const per = Math.ceil(len / n);
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const from = i * per, l = Math.min(per, len - from);
        return l > 0 ? <Sequence key={i} from={from} durationInFrames={l}><Shot id={clips[i % clips.length]} len={l} /></Sequence> : null;
      })}
    </>
  );
};

const Overlay: React.FC<{ words: W[]; seed: number }> = ({ words, seed }) => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 760, background: "linear-gradient(180deg, rgba(26,34,53,.62), rgba(26,34,53,0))" }} />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 900, background: "linear-gradient(0deg, rgba(26,34,53,.6), rgba(26,34,53,0))" }} />
    <Sparkles seed={seed} />
    <Logo />
    <Captions words={words} fps={FPS} />
  </>
);

export const HookPart: React.FC<{ b: number; h: number }> = ({ b, h }) => {
  const t = get(b, h);
  const plan = HOOKS[`${b}-${h}`];
  const words = t.woorden.filter((w) => w[0] < t.bodyStart - 0.01);
  const len = hookFrames(b);
  return (
    <AbsoluteFill style={{ background: BRAND.navy, fontFamily: FONT }}>
      <Shots clips={plan.clips} len={len} />
      <Overlay words={words} seed={h} />
      <Badge icon={plan.gfx.icon} label={plan.gfx.label} sub={plan.gfx.sub} start={5} end={len} />
    </AbsoluteFill>
  );
};

export const BodyPart: React.FC<{ b: number }> = ({ b }) => {
  const t = get(b, 1);
  const sents = BODY[b];
  const total = bodyFrames(b);
  const words: W[] = t.woorden.filter((w) => w[0] >= t.bodyStart - 0.01).map((w) => [w[0] - t.bodyStart, w[1] - t.bodyStart, w[2]]);
  const starts = t.zinnen.map((z, i) => (i === 0 ? 0 : Math.round((z[0] - t.bodyStart) * FPS) - 3));
  const last = sents.length - 1;
  return (
    <AbsoluteFill style={{ background: BRAND.navy, fontFamily: FONT }}>
      {sents.map((s, i) => {
        const from = starts[i];
        const to = i === last ? total : starts[i + 1];
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <Shots clips={s.clips} len={to - from} />
          </Sequence>
        );
      })}
      <Overlay words={words} seed={b + 3} />
      {sents.map((s, i) => {
        const from = starts[i];
        const to = i === last ? total : starts[i + 1];
        return (
          <React.Fragment key={i}>
            {s.gfx && <Badge icon={s.gfx.icon} label={s.gfx.label} sub={s.gfx.sub} start={from + 5} end={to - 2} />}
            {s.big && (
              <Sequence from={from} durationInFrames={to - from}><BigText text={s.big} /></Sequence>
            )}
          </React.Fragment>
        );
      })}
      <CtaButton start={starts[last] + 25} text="Plan een afspraak" />
    </AbsoluteFill>
  );
};

const BigText: React.FC<{ text: string }> = ({ text }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, 8, 14], [0.5, 1.12, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 760, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 120, color: "#fff", WebkitTextStroke: `12px ${BRAND.navy}`, paintOrder: "stroke fill", transform: `scale(${s})`, opacity: interpolate(f, [0, 5], [0, 1], { extrapolateRight: "clamp" }) }}>{text}</div>
  );
};

// Volledige video (hook + body) met voice-over en muziek met ducking; wordt door render_all.py niet als geheel
// gerenderd maar in delen (body één keer per body) en daarna met ffmpeg samengevoegd; bruikbaar in de studio.
export const FullVideo: React.FC<{ b: number; h: number }> = ({ b, h }) => {
  const t = get(b, h);
  const F0 = hookFrames(b);
  const total = fullFrames(b, h);
  const speech = t.woorden;
  const musicVol = (f: number) => {
    const s = f / FPS;
    const speaking = speech.some((w) => s >= w[0] - 0.1 && s <= w[1] + 0.25);
    const fadeIn = Math.min(1, s / 0.6), fadeOut = Math.min(1, (total / FPS - s) / 1.5);
    return Math.max(0, (speaking ? 0.11 : 0.22) * Math.min(fadeIn, fadeOut));
  };
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={F0}><HookPart b={b} h={h} /></Sequence>
      <Sequence from={F0} durationInFrames={bodyFrames(b)}><BodyPart b={b} /></Sequence>
      <Progress total={total} />
      <Audio src={staticFile(`vo/b${b}h${h}.wav`)} />
      <Audio src={staticFile("muziek/muziek.mp3")} volume={musicVol} />
    </AbsoluteFill>
  );
};

export const HookOnly: React.FC<{ b: number; h: number }> = (p) => (
  <AbsoluteFill><HookPart {...p} /><Progress total={fullFrames(p.b, p.h)} full={fullFrames(p.b, p.h)} /></AbsoluteFill>
);
export const BodyOnly: React.FC<{ b: number }> = ({ b }) => {
  const F0 = hookFrames(b);
  return <AbsoluteFill><BodyPart b={b} /><ProgressBody b={b} F0={F0} /></AbsoluteFill>;
};
const ProgressBody: React.FC<{ b: number; F0: number }> = ({ b, F0 }) => <Progress total={0} offset={F0} full={F0 + bodyFrames(b)} />;

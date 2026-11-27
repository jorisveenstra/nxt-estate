import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, FONT } from "./brand";
import { BODY_PLAN, HOOK_CLIPS, HOOK_PAUSE, TAIL } from "./config";
import timing from "./timing.json";
import { AccentView, Captions, Clip, Shade, TopLogo, Word } from "./ui";

type SceneT = { id: string; start: number; end: number; words: Word[] };
const T = timing as unknown as Record<string, { scenes?: SceneT[]; words?: Word[]; end: number }>;

// Hook en body worden apart gerenderd en daarna met ffmpeg -c copy samengevoegd (scripts/render.sh).
export const hookFrames = (key: string, fps: number) => Math.ceil((T[key].end + HOOK_PAUSE) * fps);
export const bodyFrames = (b: string, fps: number) => Math.ceil((T[b].end + TAIL) * fps);

const HookText: React.FC<{ words: Word[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 80px", top: -60 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 18px" }}>
        {words.map((w, i) => {
          const o = interpolate(t, [w.s - 0.08, w.s + 0.06], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const y = interpolate(t, [w.s - 0.08, w.s + 0.1], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const isQ = /\?$/.test(w.t);
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 80,
                lineHeight: 1.18,
                color: o >= 1 && isQ ? colors.taupeLight : colors.white,
                opacity: o,
                transform: `translateY(${y}px)`,
                textShadow: "0 4px 22px rgba(0,0,0,0.7), 0 0 4px rgba(0,0,0,0.5)",
              }}
            >
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const HookVideo: React.FC<{ body: number; hook: number }> = ({ body, hook }) => {
  const key = `b${body}h${hook}`;
  const { durationInFrames, fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: colors.ink }}>
      <Clip name={HOOK_CLIPS[key]} seconds={durationInFrames / fps} />
      <Shade />
      <TopLogo />
      <HookText words={T[key].words!} />
    </AbsoluteFill>
  );
};

const wordNearest = (sc: SceneT, t: number) =>
  sc.words.reduce((best, w) => (Math.abs(w.s - t) < Math.abs(best.s - t) ? w : best), sc.words[0]).s;

export const BodyVideo: React.FC<{ body: number }> = ({ body }) => {
  const b = `b${body}`;
  const { durationInFrames, fps } = useVideoConfig();
  const scenes = T[b].scenes!;
  const total = durationInFrames / fps;
  const plan = BODY_PLAN[b];
  const segs: { clip: string; from: number; to: number }[] = [];
  const accents: { id: string; from: number; to: number }[] = [];
  scenes.forEach((sc, i) => {
    const from = i === 0 ? 0 : sc.start;
    const to = i + 1 < scenes.length ? scenes[i + 1].start : total;
    const clips = plan[sc.id].clips;
    if (clips.length > 1 && to - from > 7.4) {
      const cut = wordNearest(sc, (from + to) / 2);
      segs.push({ clip: clips[0], from, to: cut }, { clip: clips[1], from: cut, to });
    } else {
      segs.push({ clip: clips[0], from, to });
    }
    accents.push({ id: sc.id, from, to });
  });
  const f = (s: number) => Math.round(s * fps);
  const words = scenes.flatMap((s) => s.words);
  return (
    <AbsoluteFill style={{ background: colors.ink }}>
      {segs.map((s, i) => (
        <Sequence key={i} from={f(s.from)} durationInFrames={f(s.to) - f(s.from)}>
          <Clip name={s.clip} seconds={s.to - s.from} />
        </Sequence>
      ))}
      <Shade />
      <TopLogo />
      {accents.map((a) =>
        plan[a.id].accent ? (
          <Sequence key={a.id} from={f(a.from) + 3} durationInFrames={f(a.to) - f(a.from) - 3}>
            <AccentView accent={plan[a.id].accent!} dur={a.id === "cta" ? 1e6 : f(a.to) - f(a.from) - 3} />
          </Sequence>
        ) : null,
      )}
      <Captions words={words} />
    </AbsoluteFill>
  );
};

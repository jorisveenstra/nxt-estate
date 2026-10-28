import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, FONT } from "./brand";
import data from "./data.json";

type Word = { t: string; s: number; e: number; i: number };
type Shot = { clip: string; trim: number; rate: number; from: number; frames: number; sent: number };
type Seg = { kind: "hook" | "body"; frames: number; words: Word[]; sents: { s: number; e: number }[]; shots: Shot[]; callouts: ([string, string | null] | null)[] };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Harde sneden: elke shot is een eigen Sequence zonder overgang
const Shots: React.FC<{ shots: Shot[] }> = ({ shots }) => (
  <>
    {shots.map((s, i) => (
      <Sequence key={i} from={s.from} durationInFrames={s.frames}>
        <OffthreadVideo src={staticFile(`clips/${s.clip}.mp4`)} startFrom={Math.round(s.trim * 30)} playbackRate={s.rate} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Sequence>
    ))}
  </>
);

const chunkWords = (words: Word[], max: number, maxLen: number) => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w) => {
    cur.push(w);
    if (/[.,?!]$/.test(w.t) || cur.length >= max || cur.map((c) => c.t).join(" ").length > maxLen) {
      out.push(cur);
      cur = [];
    }
  });
  if (cur.length) out.push(cur);
  return out;
};

const Captions: React.FC<{ words: Word[]; big: boolean; top: number }> = ({ words, big, top }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const chunks = React.useMemo(() => chunkWords(words, big ? 3 : 4, big ? 18 : 24), [words, big]);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.04 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.04));
  if (idx < 0) return null;
  const chunk = chunks[idx];
  if (t > chunk[chunk.length - 1].e + 0.5) return null;
  const pop = interpolate((t - chunk[0].s) * 30, [0, 4], [0.9, 1], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: top }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 14, rowGap: 6, maxWidth: 960, transform: `scale(${pop})`, fontFamily: FONT, fontWeight: 800, fontSize: big ? 92 : 62, lineHeight: 1.15, textAlign: "center" }}>
        {chunk.map((w, i) => {
          const active = t >= w.s - 0.02 && t < (chunk[i + 1]?.s ?? w.e + 0.5);
          return (
            <span key={i} style={{ color: colors.white, background: active ? colors.taupe : "transparent", borderRadius: 12, padding: "0 14px", textShadow: active ? "none" : "0 3px 16px rgba(0,0,0,.8), 0 1px 3px rgba(0,0,0,.9)" }}>
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Korte feitenkaart bij elke zin (maximaal ~10% van het beeld)
const Callout: React.FC<{ big: string; small: string | null; from: number; to: number }> = ({ big, small, from, to }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - from, fps, config: { damping: 13, stiffness: 160, mass: 0.7 } });
  const out = interpolate(frame, [to - 8, to], [0, 1], clamp);
  if (frame < from || frame > to) return null;
  return (
    <div style={{ position: "absolute", left: 60, top: 300, transform: `translateX(${(1 - p) * -520 - out * 520}px)`, background: "rgba(248,246,241,0.94)", borderLeft: `14px solid ${colors.taupe}`, borderRadius: 18, padding: "20px 34px 22px 28px", maxWidth: 800, boxShadow: "0 14px 40px rgba(0,0,0,.28)" }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 54, lineHeight: 1.1, color: colors.ink }}>{big}</div>
      {small ? <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 32, color: colors.green, marginTop: 6 }}>{small}</div> : null}
    </div>
  );
};

const CtaButton: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - from, fps, config: { damping: 11, stiffness: 150, mass: 0.8 } });
  const pulse = 1 + 0.03 * Math.sin((frame - from) / 5);
  if (frame < from) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 150 }}>
      <div style={{ transform: `scale(${p * pulse})`, background: colors.taupe, color: colors.white, fontFamily: FONT, fontWeight: 700, fontSize: 52, padding: "30px 64px", borderRadius: 18, boxShadow: "0 16px 44px rgba(0,0,0,.4)" }}>Plan een bezichtiging  →</div>
    </AbsoluteFill>
  );
};

export const Segment: React.FC<{ k: string }> = ({ k }) => {
  const frame = useCurrentFrame();
  const d = (data as unknown as Record<string, Seg>)[k];
  const hook = d.kind === "hook";
  const last = d.sents.length - 1;
  const logoIn = interpolate(frame, [0, 10], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Shots shots={d.shots} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(27,34,31,.55) 0%, rgba(27,34,31,0) 20%, rgba(27,34,31,0) 55%, rgba(27,34,31,.7) 100%)" }} />
      <div style={{ position: "absolute", top: 96, left: 60, opacity: logoIn, filter: "drop-shadow(0 2px 10px rgba(0,0,0,.55))" }}>
        <Img src={staticFile("logo/logo.png")} style={{ width: 340 }} />
      </div>
      {hook ? (
        <>
          <Captions words={d.words} big top={760} />
          <div style={{ position: "absolute", top: 100, right: 60, background: colors.taupe, color: colors.white, fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: 2, padding: "10px 24px", borderRadius: 10, textTransform: "uppercase" }}>Nieuwbouw · Roosendaal</div>
        </>
      ) : (
        <>
          {d.callouts.map((c, i) =>
            c && i < last ? <Callout key={i} big={c[0]} small={c[1]} from={Math.round(d.sents[i].s * 30) + 4} to={Math.round(d.sents[i].e * 30) + 10} /> : null,
          )}
          <Captions words={d.words} big={false} top={1380} />
          <CtaButton from={Math.round(d.sents[last].s * 30) + 6} />
          <div style={{ position: "absolute", left: 0, bottom: 0, height: 10, width: `${(frame / d.frames) * 100}%`, background: colors.taupe }} />
        </>
      )}
    </AbsoluteFill>
  );
};

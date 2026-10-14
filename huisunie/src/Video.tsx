import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,

  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts } from "./brand";
import clipLengths from "./clips.json";
import { CTA_CLIP, HOOK_ACCENT, HOOK_CLIPS, sceneClips } from "./config";
import {
  BlijvenScene,
  BodScene,
  CtaScene,
  GebrekenScene,
  HookScene,
  KostenScene,
  NietsScene,
  SceneProps,
  SpullenScene,
  VoorbehoudScene,
  ZekerheidScene,
  ZoalsScene,
} from "./scenes";
import { getTiming, HUIS_PAD, Scene, wordTime } from "./ui";

export type VideoProps = { body: number; hook: number };

export const TAIL = 2.2; // seconden na de laatste zin

type Segment = { clip: string; from: number; to: number };

const buildSegments = (body: number, hook: number, scenes: Scene[], end: number): Segment[] => {
  const segs: Segment[] = [];
  scenes.forEach((sc, i) => {
    const sceneEnd = i + 1 < scenes.length ? scenes[i + 1].start : end;
    const list = sc.id === "hook" ? HOOK_CLIPS[body][hook] : sceneClips(body, sc.id);
    list.forEach(([clip, word], k) => {
      const from = k === 0 ? (i === 0 ? 0 : sc.start) : wordTime(sc, word!);
      const next = list[k + 1];
      const to = next ? wordTime(sc, next[1]!) : sceneEnd;
      segs.push({ clip, from, to });
    });
  });
  return segs;
};

const ClipSegment: React.FC<{ seg: Segment; durationInFrames: number }> = ({ seg, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = durationInFrames / fps;
  // Clips duren 2,6 tot 7 s; langere stukken vertraagd afspelen zodat de clip niet opraakt
  const len = (clipLengths as Record<string, number>)[seg.clip] - 0.1;
  const rate = Math.min(1, len / dur);
  // "Punch-in" bij elke knip
  const punch = interpolate(frame, [0, 10], [1.14, 1.02], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const drift = interpolate(frame, [10, durationInFrames], [1.02, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flash = interpolate(frame, [0, 5], [0.35, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${frame < 10 ? punch : drift})` }}>
        <OffthreadVideo src={staticFile(`clips/${seg.clip}.mp4`)} muted playbackRate={rate} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: colors.white, opacity: flash }} />
    </AbsoluteFill>
  );
};

// Overgang: het huisje uit het logo groeit vanuit het midden over het hele beeld en opent zich weer
const SceneWipe: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const grow = interpolate(frame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const open = interpolate(frame, [9, 17], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const s = grow * 60;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {frame < 9 ? (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <g transform={`translate(${width / 2} ${height / 2}) scale(${s}) translate(-35 -47)`}>
            <path d={HUIS_PAD} fill="#2196F3" fillRule="evenodd" />
            <path d="M13.9432 74.0484H55.9779V46.9176L34.9674 25.9628L13.9432 46.9176Z" fill="#003061" />
          </g>
        </svg>
      ) : (
        <AbsoluteFill style={{ background: colors.navy, clipPath: `circle(${(1 - open) * 120}% at 50% 50%)` }} />
      )}
    </AbsoluteFill>
  );
};

// Ondertitels: korte groepjes woorden, het gesproken woord licht op
const Captions: React.FC<{ scenes: Scene[] }> = ({ scenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const words = scenes.filter((s) => s.id !== "cta").flatMap((s) => s.words);
  const chunks: (typeof words)[] = [];
  let cur: typeof words = [];
  words.forEach((w) => {
    cur.push(w);
    const len = cur.map((c) => c.t).join(" ").length;
    if (/[.,?!]$/.test(w.t) || cur.length >= 4 || len > 20) {
      chunks.push(cur);
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.05));
  const chunk = idx >= 0 ? chunks[idx] : null;
  if (!chunk || t > chunk[chunk.length - 1].e + 0.6) return null;
  const since = (t - chunk[0].s) * fps;
  const pop = interpolate(since, [0, 4], [0.85, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1330 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: 16,
          maxWidth: 940,
          transform: `scale(${pop})`,
          fontFamily: fonts.head,
          fontWeight: 800,
          fontSize: 58,
          textAlign: "center",
        }}
      >
        {chunk.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (chunk[i + 1]?.s ?? w.e + 0.6);
          return (
            <span
              key={i}
              style={{
                color: colors.white,
                background: active ? colors.sky : "transparent",
                padding: "2px 12px",
                borderRadius: active ? 6 : undefined,
                textShadow: active ? "none" : "0 3px 14px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.9)",
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

const SCENES: Record<string, React.FC<SceneProps>> = {
  zoals: ZoalsScene,
  niets: NietsScene,
  spullen: SpullenScene,
  voorbehoud: VoorbehoudScene,
  zekerheid: ZekerheidScene,
  gebreken: GebrekenScene,
  blijven: BlijvenScene,
  kosten: KostenScene,
  bod: BodScene,
};

export const getDuration = (body: number, hook: number, fps: number) => Math.ceil((getTiming(body, hook).end + TAIL) * fps);

export const HuisunieVideo: React.FC<VideoProps> = ({ body, hook }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const timing = getTiming(body, hook);
  const end = timing.end + TAIL;
  const F = (s: number) => Math.round(s * fps);
  const segs = buildSegments(body, hook, timing.scenes, end);
  const cta = timing.scenes.find((s) => s.id === "cta")!;
  const logoIn = interpolate(frame, [F(timing.scenes[1].start), F(timing.scenes[1].start) + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.navy }}>
      {segs.map((seg, i) => (
        <Sequence key={i} from={F(seg.from)} durationInFrames={Math.max(1, F(seg.to) - F(seg.from))}>
          <ClipSegment seg={seg} durationInFrames={Math.max(1, F(seg.to) - F(seg.from))} />
        </Sequence>
      ))}

      {/* Verloop boven en onder voor leesbaarheid */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,24,48,0.55) 0%, rgba(0,24,48,0) 22%, rgba(0,24,48,0) 58%, rgba(0,24,48,0.65) 100%)",
        }}
      />

      {/* Klein logo linksboven vanaf de body */}
      <div style={{ position: "absolute", top: 76, left: 50, opacity: logoIn * (frame < F(cta.start) - 6 ? 1 : 0), filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}>
        <Img src={staticFile("logo/huisunie.svg")} style={{ width: 230 }} />
      </div>

      {timing.scenes.map((sc, i) => {
        const next = timing.scenes[i + 1]?.start ?? end;
        if (sc.id === "cta") return null;
        return (
          <Sequence key={sc.id} from={0} durationInFrames={F(next) + 2} layout="none">
            {sc.id === "hook" ? (
              <HookScene scene={sc} outAt={next} accent={HOOK_ACCENT[body][hook]} />
            ) : (
              React.createElement(SCENES[sc.id], { scene: sc, outAt: next })
            )}
          </Sequence>
        );
      })}

      <Captions scenes={timing.scenes} />

      {/* Veeg-overgang bij elke nieuwe scène */}
      {timing.scenes.slice(1).map((sc) => (
        <Sequence key={`wipe-${sc.id}`} from={F(sc.start) - 8} durationInFrames={18}>
          <SceneWipe />
        </Sequence>
      ))}

      <CtaScene scene={cta} outAt={end} clip={CTA_CLIP} />

      <Audio src={staticFile(`vo/b${body}h${hook}.wav`)} />
    </AbsoluteFill>
  );
};

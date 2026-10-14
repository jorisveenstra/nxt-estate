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
  AnimoScene,
  CtaScene,
  DeurenScene,
  HookScene,
  IndelingScene,
  IntroScene,
  KenmerkenScene,
  LaatsteScene,
  LocatieScene,
  OnderhoudScene,
  ParkerenScene,
  PlanningScene,
  PrijsScene,
  ReistijdScene,
  SceneProps,
  TerreinScene,
  VloerScene,
} from "./scenes";
import { getTiming, Scene, wordTime } from "./ui";

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

// Overgang: verticale gevelpanelen (zoals de zwarte sandwichpanelen van het pand) die neer- en weer wegschuiven
const SceneWipe: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cols = 7;
  const w = width / cols;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: cols }, (_, c) => {
        const d = c * 0.9;
        const inn = interpolate(frame, [d, d + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
        const out = interpolate(frame, [d + 8, d + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
        const red = c === 2 || c === 5;
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: c * w,
              width: w + 1,
              top: 0,
              height,
              background: red ? colors.red : c % 2 ? colors.ink : colors.dark,
              borderRight: red ? undefined : `3px solid ${colors.grey}`,
              transform: `translateY(${(c % 2 ? -1 : 1) * (1 - inn) * height + out * (c % 2 ? 1 : -1) * height}px)`,
            }}
          />
        );
      })}
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
          fontFamily: fonts.sans,
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
                background: active ? colors.red : "transparent",
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
  intro: IntroScene,
  prijs: PrijsScene,
  laatste: LaatsteScene,
  indeling: IndelingScene,
  kenmerken: KenmerkenScene,
  terrein: TerreinScene,
  vloer: VloerScene,
  parkeren: ParkerenScene,
  deuren: DeurenScene,
  locatie: LocatieScene,
  reistijd: ReistijdScene,
  onderhoud: OnderhoudScene,
  planning: PlanningScene,
  animo: AnimoScene,
};

export const getDuration = (body: number, hook: number, fps: number) => Math.ceil((getTiming(body, hook).end + TAIL) * fps);

export const MaartensVideo: React.FC<VideoProps> = ({ body, hook }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const timing = getTiming(body, hook);
  const end = timing.end + TAIL;
  const F = (s: number) => Math.round(s * fps);
  const segs = buildSegments(body, hook, timing.scenes, end);
  const cta = timing.scenes.find((s) => s.id === "cta")!;
  const logoIn = interpolate(frame, [F(timing.scenes[1].start), F(timing.scenes[1].start) + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      {segs.map((seg, i) => (
        <Sequence key={i} from={F(seg.from)} durationInFrames={Math.max(1, F(seg.to) - F(seg.from))}>
          <ClipSegment seg={seg} durationInFrames={Math.max(1, F(seg.to) - F(seg.from))} />
        </Sequence>
      ))}

      {/* Verloop boven en onder voor leesbaarheid */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(20,20,20,0.55) 0%, rgba(20,20,20,0) 22%, rgba(20,20,20,0) 58%, rgba(20,20,20,0.65) 100%)",
        }}
      />

      {/* Klein logo linksboven vanaf de body */}
      <Img
        src={staticFile("logo/mb-wit.png")}
        style={{ position: "absolute", top: 70, left: 64, width: 130, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))", opacity: logoIn * (frame < F(cta.start) - 6 ? 1 : 0) }}
      />

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

import React from "react";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AccentView, Kicker, Woordmerk } from "./accents";
import { FPS } from "./brand";
import { Captions, Scene } from "./captions";
import plan from "./plan.json";
import timing from "./timing.json";

type Shot = { clip: string; start: number; end: number; van: number; rate: number };
const T = timing as unknown as Record<string, { scenes: Scene[]; duur: number }>;
const P = plan as any;

// Eén doorlopende shot, beeldvullend; alleen een zeer langzame camerabeweging binnen de shot.
const ShotView: React.FC<{ shot: Shot; frames: number }> = ({ shot, frames }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, frames], [1.0, 1.045], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      <OffthreadVideo src={staticFile(`clips/${shot.clip}.mp4`)} muted playbackRate={shot.rate} startFrom={Math.round(shot.van * FPS)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

// Harde cuts: elke shot is een eigen Sequence zonder overgang
const Shots: React.FC<{ shots: Shot[] }> = ({ shots }) => (
  <>
    {shots.map((s, i) => {
      const from = Math.round(s.start * FPS);
      const to = Math.round(s.end * FPS);
      return (
        <Sequence key={i} from={from} durationInFrames={to - from}>
          <ShotView shot={s} frames={to - from} />
        </Sequence>
      );
    })}
  </>
);

// Lichte verlopen boven en onder voor leesbaarheid (geen dichte vlakken)
const Shade: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.38) 78%, rgba(0,0,0,0.12) 100%)",
    }}
  />
);

const Logo: React.FC = () => (
  <AbsoluteFill style={{ top: 140, left: 64 }}>
    <Woordmerk size={0.9} />
  </AbsoluteFill>
);

export const HookSegment: React.FC<{ b: string; h: number }> = ({ b, h }) => {
  const key = `${b}_h${h}`;
  const hp = P.hooks[key];
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Shots shots={hp.shots} />
      <Shade />
      <Logo />
      <Sequence from={4}>
        <Kicker text={hp.kicker.text} note={hp.kicker.note} dur={hp.frames / fps} />
      </Sequence>
      <Captions scenes={T[key].scenes} until={hp.frames / fps} />
    </AbsoluteFill>
  );
};

export const BodySegment: React.FC<{ b: string }> = ({ b }) => {
  const bp = P.bodies[b];
  const { fps } = useVideoConfig();
  const ctaStart = bp.accents.find((a: any) => a.type === "cta")?.start ?? 1e9;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Shots shots={bp.shots} />
      <Shade />
      <Sequence durationInFrames={Math.round(ctaStart * fps)}>
        <Logo />
      </Sequence>
      {bp.accents.map((a: any, i: number) => {
        const from = Math.round(a.start * fps);
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, Math.round(a.end * fps) - from)}>
            <AccentView a={a} />
          </Sequence>
        );
      })}
      <Captions scenes={T[`${b}_body`].scenes} until={bp.frames / fps} />
    </AbsoluteFill>
  );
};

// Volledige advertentie (hook + body) met de gemixte audio uit scripts/mix_audio.py
export const FullVideo: React.FC<{ b: string; h: number }> = ({ b, h }) => {
  const hf = P.hooks[`${b}_h${h}`].frames;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={hf}>
        <HookSegment b={b} h={h} />
      </Sequence>
      <Sequence from={hf}>
        <BodySegment b={b} />
      </Sequence>
      <Audio src={staticFile(`mix/${b}_h${h}.wav`)} />
    </AbsoluteFill>
  );
};

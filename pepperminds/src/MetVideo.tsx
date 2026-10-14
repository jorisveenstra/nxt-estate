import React from "react";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile } from "remotion";
import { FPS } from "./brand";
import { getIntroDuration, Intro, IntroProps } from "./Intro";
import { Outro, OUTRO_DURATION, OutroProps } from "./Outro";

// Gemeten muziekwaarden per video; gemaakt met scripts/maak_audio.py
export type Muziek = {
  // Audio van de video, met de muziek al naadloos doorgelust voor de outro
  audio: string;
  // Muziek voor de intro, begint met de drop
  introMuziek: string;
  beatFrames: number;
  outroFirstBeat: number;
  outroFinalHit: number;
  // Tot hoe ver (sec) in de video de intromuziek zacht doorloopt onder het praten.
  // 0 = de video heeft zelf al muziek onder het praten; intromuziek stopt dan op de knip.
  bedTot: number;
};

export type MetVideoProps = {
  video: string;
  videoDuration: number; // in frames
  muziek: Muziek;
  intro: IntroProps;
  outro: OutroProps;
};

const BED_UNDER_SPEECH = 0.12;

export const getMetVideoDuration = (p: MetVideoProps) =>
  getIntroDuration(p.muziek.beatFrames) + p.videoDuration + OUTRO_DURATION;

export const MetVideo: React.FC<MetVideoProps> = ({ video, videoDuration, muziek, intro, outro }) => {
  const introDuration = getIntroDuration(muziek.beatFrames);
  const outroStart = introDuration + videoDuration;
  const bedEnd = Math.round(muziek.bedTot * FPS);

  const introVolume = (f: number) =>
    bedEnd > 0
      ? interpolate(
          f,
          [0, introDuration - 4, introDuration + 1, introDuration + bedEnd - 12, introDuration + bedEnd],
          [1, 1, BED_UNDER_SPEECH, BED_UNDER_SPEECH, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      : interpolate(f, [0, introDuration - 5, introDuration], [1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Sequence durationInFrames={introDuration}>
        <Intro {...intro} beatFrames={muziek.beatFrames} />
      </Sequence>

      <Sequence from={introDuration} durationInFrames={videoDuration}>
        <OffthreadVideo src={staticFile(video)} muted />
      </Sequence>

      <Sequence from={outroStart} durationInFrames={OUTRO_DURATION}>
        <Outro
          {...outro}
          beatFrames={muziek.beatFrames}
          firstBeat={muziek.outroFirstBeat}
          finalHit={muziek.outroFinalHit}
        />
      </Sequence>

      {/* Intromuziek: vol tijdens de intro, daarna zacht onder het praten (of stoppen op de knip) */}
      <Sequence durationInFrames={introDuration + Math.max(bedEnd, 1)}>
        <Audio src={staticFile(muziek.introMuziek)} volume={introVolume} />
      </Sequence>

      {/* Video-audio + muziek die naadloos doorloopt in de outro.
          Iets zachter zolang de intromuziek eronder ligt, zodat het niet clipt. */}
      <Sequence from={introDuration} durationInFrames={videoDuration + OUTRO_DURATION}>
        <Audio
          src={staticFile(muziek.audio)}
          volume={(f) =>
            bedEnd > 0
              ? interpolate(f, [bedEnd, bedEnd + 10], [0.88, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : 1
          }
        />
      </Sequence>
    </AbsoluteFill>
  );
};

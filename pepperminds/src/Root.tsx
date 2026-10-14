import React from "react";
import { Composition } from "remotion";
import { FPS } from "./brand";
import { getIntroDuration, Intro, IntroProps } from "./Intro";
import { getMetVideoDuration, MetVideo, MetVideoProps } from "./MetVideo";
import { Outro, OUTRO_DURATION, OutroProps } from "./Outro";

// Teksten zijn in Remotion Studio aan te passen via het props-paneel rechts.
const introProps: IntroProps = {
  lines: ["wie ben je", "en waarom", "werk jij bij", "pepperminds?"],
};

const outroProps: OutroProps = {
  question1: "Word jij onze",
  question2: "nieuwe collega?",
  button: "Klik hieronder",
  subline: "en kom kennismaken!",
  url: "pepperminds.nl",
};

// Muziekwaarden komen uit scripts/maak_audio.py
const videos: (Omit<MetVideoProps, "intro" | "outro"> & { id: string; intro?: IntroProps })[] = [
  {
    id: "Ravi",
    video: "ravi.mp4",
    videoDuration: 304,
    muziek: {
      audio: "ravi-audio-verlengd.wav",
      introMuziek: "ravi-muziek-intro.wav",
      beatFrames: 0.5132 * FPS,
      outroFirstBeat: 10.6,
      outroFinalHit: 126,
      bedTot: 5.4,
    },
  },
  {
    id: "Imke",
    video: "imke.mp4",
    videoDuration: 407,
    muziek: {
      audio: "imke-audio-verlengd.wav",
      introMuziek: "imke-muziek-intro.wav",
      beatFrames: 12,
      outroFirstBeat: 16.48,
      outroFinalHit: 88,
      bedTot: 3,
    },
  },
  {
    id: "Twee-dames",
    video: "twee-dames.mp4",
    // Ze zeggen hun namen niet, dus alleen de waarom-vraag
    intro: { lines: ["waarom", "werk je bij", "pepperminds?"] },
    videoDuration: 432,
    muziek: {
      audio: "twee-dames-audio-verlengd.wav",
      introMuziek: "twee-dames-muziek-intro.wav",
      beatFrames: 13.511,
      outroFirstBeat: 22.19,
      outroFinalHit: 76,
      bedTot: 0, // video heeft zelf muziek onder het praten
    },
  },
  {
    id: "Aniek",
    video: "aniek.mp4",
    videoDuration: 314,
    muziek: {
      audio: "aniek-audio-verlengd.wav",
      introMuziek: "aniek-muziek-intro.wav",
      beatFrames: 12,
      outroFirstBeat: 18.82,
      outroFinalHit: 91,
      bedTot: 3,
    },
  },
  {
    id: "Eluarie",
    video: "eluarie.mp4",
    videoDuration: 574,
    muziek: {
      audio: "eluarie-audio-verlengd.wav",
      introMuziek: "eluarie-muziek-intro.wav",
      beatFrames: 12.821,
      outroFirstBeat: 17.74,
      outroFinalHit: 107,
      bedTot: 3,
    },
  },
];

const formats = [
  { name: "Staand", width: 1080, height: 1920 },
  { name: "Liggend", width: 1920, height: 1080 },
];

export const Root: React.FC = () => (
  <>
    {videos.map(({ id, intro, ...v }) => {
      const props: MetVideoProps = { ...v, intro: intro ?? introProps, outro: outroProps };
      return (
        <Composition
          key={id}
          id={id}
          component={MetVideo}
          durationInFrames={getMetVideoDuration(props)}
          fps={FPS}
          width={1080}
          height={1920}
          defaultProps={props}
        />
      );
    })}
    {formats.map((f) => (
      <React.Fragment key={f.name}>
        <Composition
          id={`Intro-${f.name}`}
          component={Intro}
          durationInFrames={getIntroDuration()}
          fps={FPS}
          width={f.width}
          height={f.height}
          defaultProps={introProps}
        />
        <Composition
          id={`Outro-${f.name}`}
          component={Outro}
          durationInFrames={OUTRO_DURATION}
          fps={FPS}
          width={f.width}
          height={f.height}
          defaultProps={outroProps}
        />
      </React.Fragment>
    ))}
  </>
);

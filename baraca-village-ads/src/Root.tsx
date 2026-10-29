import React from "react";
import { Composition } from "remotion";
import { Ad, AdProps } from "./Ad";
import { FPS, HEIGHT, WIDTH } from "./brand";

const defaults: AdProps = {
  frames: 150, shots: [], audio: [], music: null, words: [], duckWords: [], globalOffsetFrames: 0,
  totalFrames: 150, accents: [], cta: null, wordmark: true, fadeIn: true, fadeOut: false,
};

export const Root: React.FC = () => (
  <Composition
    id="Ad"
    component={Ad}
    width={WIDTH}
    height={HEIGHT}
    fps={FPS}
    durationInFrames={150}
    defaultProps={defaults}
    calculateMetadata={({ props }) => ({ durationInFrames: props.frames })}
  />
);

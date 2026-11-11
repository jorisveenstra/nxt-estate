import React from "react";
import { Composition } from "remotion";
import { Seg, SegProps } from "./Seg";

const defaults: SegProps = { frames: 150, shots: [], captions: [], accents: [], cta: null, hook: false };

export const Root: React.FC = () => (
  <Composition
    id="Seg"
    component={Seg}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={150}
    defaultProps={defaults}
    calculateMetadata={({ props }) => ({ durationInFrames: (props as SegProps).frames })}
  />
);

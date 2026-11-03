import React from "react";
import { Composition } from "remotion";
import { Ad, AdProps } from "./Ad";
import b1h1 from "../props/b1h1.json";

export const Root: React.FC = () => (
  <Composition
    id="Ad"
    component={Ad as React.FC<any>}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={b1h1.duration}
    defaultProps={b1h1 as unknown as AdProps}
    calculateMetadata={({ props }) => ({ durationInFrames: (props as AdProps).duration })}
  />
);

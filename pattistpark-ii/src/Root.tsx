import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { getDuration, PattistVideo } from "./Video";

export const Root: React.FC = () => (
  <>
    {[1, 2, 3, 4, 5, 6, 7].map((h) => (
      <Composition
        key={h}
        id={`Body1-Hook${h}`}
        component={PattistVideo}
        durationInFrames={getDuration(h)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ hook: h }}
      />
    ))}
  </>
);

import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { HOOKS } from "./config";
import timing from "./timing.json";
import { getDuration, PattistparkVideo } from "./Video";

// Eén video per body + hook (1080x1920, 9:16). Timing komt uit src/timing.json (scripts/bouw_timing.py).
export const Root: React.FC = () => (
  <>
    {Array.from({ length: HOOKS }, (_, i) => i + 1)
      .filter((h) => `b1h${h}` in timing)
      .map((h) => (
        <Composition
          key={h}
          id={`Body1-Hook${h}`}
          component={PattistparkVideo}
          durationInFrames={getDuration(h, FPS)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ hook: h }}
        />
      ))}
  </>
);

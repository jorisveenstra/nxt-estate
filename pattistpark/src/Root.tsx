import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { BODIES, HOOKS } from "./config";
import timing from "./timing.json";
import { getDuration, PattistparkVideo } from "./Video";

// Eén video per body + hook (1080x1920, 9:16). Timing komt uit src/timing.json (scripts/bouw_timing.py).
export const Root: React.FC = () => (
  <>
    {BODIES.flatMap((b) =>
      Array.from({ length: HOOKS }, (_, i) => i + 1)
        .filter((h) => `b${b}h${h}` in timing)
        .map((h) => (
        <Composition
          key={`${b}-${h}`}
          id={`Body${b}-Hook${h}`}
          component={PattistparkVideo}
          durationInFrames={getDuration(b, h, FPS)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ body: b, hook: h }}
        />
        )),
    )}
  </>
);

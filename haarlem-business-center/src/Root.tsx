import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { BODIES } from "./config";
import timing from "./timing.json";
import { getDuration, HbcVideo } from "./Video";

// Eén video per body + hook (1080x1920, 9:16). Timing komt uit src/timing.json (scripts/lijn_uit.py).
export const Root: React.FC = () => (
  <>
    {Object.entries(BODIES).flatMap(([b, n]) =>
      Array.from({ length: n }, (_, i) => i + 1)
        .filter((h) => `b${b}h${h}` in timing)
        .map((h) => (
          <Composition
            key={`${b}-${h}`}
            id={`Body${b}-Hook${h}`}
            component={HbcVideo}
            durationInFrames={getDuration(Number(b), h, FPS)}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            defaultProps={{ body: Number(b), hook: h }}
          />
        )),
    )}
  </>
);

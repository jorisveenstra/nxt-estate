import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { VIDEOS } from "./config";
import { getDuration, HbcVideo } from "./Video";

// Eén video per body + hook (zie VIDEOS in config.ts). Timing komt uit src/timing.json (scripts/maak_vo.py).
export const Root: React.FC = () => (
  <>
    {VIDEOS.map(({ body, hook }) => (
      <Composition
        key={`${body}-${hook}`}
        id={`Body${body}-Hook${hook}`}
        component={HbcVideo}
        durationInFrames={getDuration(body, hook, FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ body, hook }}
      />
    ))}
  </>
);

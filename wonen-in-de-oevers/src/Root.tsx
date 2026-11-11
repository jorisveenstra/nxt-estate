import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import timing from "./timing.json";
import { BodyVideo, HookVideo } from "./Video";

// Body (zinnen + CTA) en hook worden apart gerenderd en met ffmpeg samengevoegd (scripts/render_alles.sh).
export const Root: React.FC = () => (
  <>
    {Object.entries(timing).map(([k, v]) => {
      const isHook = /^b\d+h\d+$/.test(k);
      return (
        <Composition key={k} id={isHook ? `Hook-${k}` : `Body-${k}`} component={(isHook ? HookVideo : BodyVideo) as React.FC<{ id: string }>}
          durationInFrames={v.frames} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ id: k }} />
      );
    })}
  </>
);

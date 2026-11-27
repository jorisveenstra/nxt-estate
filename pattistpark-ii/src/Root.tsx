import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { BodyVideo, bodyFrames, HookVideo, hookFrames } from "./Video";

// Staand 1080x1920. Per body één body-render ("Body1") en per hook een korte hook-render ("Body1-Hook1");
// scripts/render.sh plakt ze aan elkaar en mixt voice-over + muziek.
export const Root: React.FC = () => (
  <>
    {[1, 2, 3].map((b) => (
      <React.Fragment key={b}>
        <Composition
          id={`Body${b}`}
          component={BodyVideo}
          durationInFrames={bodyFrames(`b${b}`, FPS)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ body: b }}
        />
        {[1, 2, 3, 4, 5].map((h) => (
          <Composition
            key={h}
            id={`Body${b}-Hook${h}`}
            component={HookVideo}
            durationInFrames={hookFrames(`b${b}h${h}`, FPS)}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            defaultProps={{ body: b, hook: h }}
          />
        ))}
      </React.Fragment>
    ))}
  </>
);

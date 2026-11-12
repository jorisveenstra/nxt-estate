import React from "react";
import { Composition } from "remotion";
import { BodyVideo, bodyFrames, HookVideo, hookFrames } from "./Ad";
import { FPS, HEIGHT, WIDTH } from "./brand";

// Hooks en bodies worden los gerenderd (zonder audio) en daarna per video met ffmpeg -c copy
// aan elkaar gezet; audio (voice-over + muziek) wordt in scripts/assemble.py gemixt.
export const Root: React.FC = () => (
  <>
    {[1, 2, 3].map((b) => (
      <React.Fragment key={b}>
        <Composition id={`Body${b}`} component={BodyVideo} durationInFrames={bodyFrames(b, FPS)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b }} />
        {[1, 2, 3, 4, 5].map((h) => (
          <Composition key={h} id={`Body${b}-Hook${h}-hook`} component={HookVideo} durationInFrames={hookFrames(b, h, FPS)} fps={FPS} width={WIDTH} height={HEIGHT}
            defaultProps={{ body: b, hook: h }} />
        ))}
      </React.Fragment>
    ))}
  </>
);

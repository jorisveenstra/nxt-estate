import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { BodyVideo, bodySeconds, HookVideo, hookSeconds } from "./Video";

// Body's en hooks worden los gerenderd (timing relatief aan het begin van elk deel) en daarna met ffmpeg aan elkaar gezet.
export const Root: React.FC = () => (
  <>
    {[1, 2, 3].map((b) => (
      <React.Fragment key={b}>
        <Composition id={`Body${b}`} component={BodyVideo} durationInFrames={Math.ceil(bodySeconds(b) * FPS)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b }} />
        {[1, 2, 3, 4, 5].map((h) => (
          <Composition key={h} id={`Hook${b}-${h}`} component={HookVideo} durationInFrames={Math.ceil(hookSeconds(b, h) * FPS)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b, hook: h }} />
        ))}
      </React.Fragment>
    ))}
  </>
);

import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { bodyFrames, hookFrames } from "./config";
import { BodyPart, FullVideo, HookPart } from "./Video";

// Gerenderd wordt per body één keer (Body<b>) en per hook apart (Hook<b>-<h>); daarna plakt
// scripts/render_all.py ze met ffmpeg -c copy aan elkaar en voegt de audiomix toe.
export const Root: React.FC = () => (
  <>
    {[1, 2].map((b) => (
      <React.Fragment key={b}>
        <Composition id={`Body${b}`} component={BodyPart} durationInFrames={bodyFrames(b)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ b }} />
        {[1, 2, 3, 4, 5].map((h) => (
          <React.Fragment key={h}>
            <Composition id={`Hook${b}-${h}`} component={HookPart} durationInFrames={hookFrames(b, h)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ b, h }} />
            <Composition id={`Body${b}-Hook${h}`} component={FullVideo} durationInFrames={hookFrames(b, h) + bodyFrames(b)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ b, h }} />
          </React.Fragment>
        ))}
      </React.Fragment>
    ))}
  </>
);

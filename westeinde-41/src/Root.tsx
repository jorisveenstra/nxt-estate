import React from "react";
import { Composition } from "remotion";
import { BodySegment, HookSegment, bodyFrames, hookFrames } from "./Video";
import { FPS } from "./config";

// Staand 9:16, 1080x1920. Per body één body-segment (eenmaal gerenderd) en per hook een kort hook-segment.
// scripts/render_alles.py plakt hook + body aan elkaar (ffmpeg -c copy) en mixt voice-over + muziek.
export const Root: React.FC = () => (
  <>
    {["b1", "b2", "b3"].map((b) => (
      <React.Fragment key={b}>
        <Composition id={`Body-${b}`} component={BodySegment} defaultProps={{ b }} durationInFrames={bodyFrames(b)} fps={FPS} width={1080} height={1920} />
        {[1, 2, 3, 4, 5].map((h) => (
          <Composition key={h} id={`Hook-${b}-h${h}`} component={HookSegment} defaultProps={{ b, h }} durationInFrames={hookFrames(b, h)} fps={FPS} width={1080} height={1920} />
        ))}
      </React.Fragment>
    ))}
  </>
);

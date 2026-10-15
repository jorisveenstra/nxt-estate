import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { BodyVideo, bodyFrames, HookVideo, hookFrames } from "./Video";

// Body (zin-voor-zin scènes + CTA) wordt één keer per body gerenderd; de hook per variant apart.
// scripts/render_alles.sh plakt hook + body met ffmpeg (-c copy) en mixt voice-over en muziek.
export const Root: React.FC = () => (
  <>
    {["b1", "b2", "b3"].map((b) => (
      <React.Fragment key={b}>
        <Composition id={`Body-${b}`} component={BodyVideo} durationInFrames={bodyFrames(b)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b }} />
        {[1, 2, 3, 4, 5].map((h) => (
          <Composition key={h} id={`Hook-${b}h${h}`} component={HookVideo} durationInFrames={hookFrames(`${b}h${h}`)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b, hook: h }} />
        ))}
      </React.Fragment>
    ))}
  </>
);

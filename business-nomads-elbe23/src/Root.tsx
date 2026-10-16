import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { BodyVideo, bodyFrames, HookVideo, hookFrames } from "./Video";
import timing from "./timing.json";

// Body wordt één keer per body gerenderd, de hook per variant; samengevoegd met ffmpeg -c copy (scripts/render_alles.py).
export const Root: React.FC = () => (
  <>
    {Object.keys(timing.bodies).map((b) => (
      <Composition key={b} id={`Body-${b}`} component={BodyVideo} durationInFrames={bodyFrames(b)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b }} />
    ))}
    {Object.keys(timing.hooks).map((k) => (
      <Composition key={k} id={`Hook-${k}`} component={HookVideo} durationInFrames={hookFrames(k)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ hookKey: k }} />
    ))}
  </>
);

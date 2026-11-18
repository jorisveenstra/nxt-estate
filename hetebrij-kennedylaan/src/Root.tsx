import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import timing from "./timing.json";
import { BodyVideo, HookVideo } from "./Video";

// Hooks en bodies worden los gerenderd (zonder audio) en daarna per variant met ffmpeg -c copy
// aan elkaar gezet; audio (voice-over + muziekbed) wordt in scripts/monteer.py gemixt.
// "Preview-B<b>-H<h>" toont de volledige variant in de studio.
const T = timing as Record<string, { frames: number }>;

export const Root: React.FC = () => (
  <>
    {[1, 2, 3].map((b) => (
      <Composition key={`b${b}`} id={`Body${b}`} component={BodyVideo} durationInFrames={T[`b${b}`].frames}
        fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b, offset: 0 }} />
    ))}
    {[1, 2, 3].flatMap((b) =>
      [1, 2, 3, 4, 5].map((h) => (
        <Composition key={`b${b}h${h}`} id={`Hook-B${b}-H${h}`} component={HookVideo}
          durationInFrames={T[`b${b}h${h}`].frames} fps={FPS} width={WIDTH} height={HEIGHT}
          defaultProps={{ body: b, hook: h }} />
      )),
    )}
  </>
);

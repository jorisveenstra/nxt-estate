import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { HOOK_SHOTS } from "./config";
import { BodySegment, bodyFrames, FullVideo, HookSegment, hookFrames } from "./Video";

// Productie: "Hook-b1hN" en "Body-b1" worden los (zonder audio) gerenderd en met ffmpeg samengevoegd
// (scripts/render.sh). "Body1-HookN" is de complete video met audio voor de studio en revisies.
export const Root: React.FC = () => (
  <>
    {Object.keys(HOOK_SHOTS).map((k) => {
      const b = k.split("h")[0];
      const h = Number(k.split("h")[1]);
      return (
        <React.Fragment key={k}>
          <Composition id={`Hook-${k}`} component={HookSegment} durationInFrames={hookFrames(k)} fps={FPS}
            width={WIDTH} height={HEIGHT} defaultProps={{ k }} />
          <Composition id={`Body${b.slice(1)}-Hook${h}`} component={FullVideo}
            durationInFrames={hookFrames(k) + bodyFrames(b)} fps={FPS} width={WIDTH} height={HEIGHT}
            defaultProps={{ k }} />
        </React.Fragment>
      );
    })}
    <Composition id="Body-b1" component={BodySegment} durationInFrames={bodyFrames("b1")} fps={FPS}
      width={WIDTH} height={HEIGHT} defaultProps={{ b: "b1" }} />
  </>
);

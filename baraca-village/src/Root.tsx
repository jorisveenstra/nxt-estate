import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import plan from "./plan.json";
import { BodySegment, FullVideo, HookSegment } from "./Video";

const P = plan as any;

// Body<b>-Hook<h>: volledige advertentie. Hook-/Body-segmenten worden apart (zonder audio) gerenderd en
// met ffmpeg -c copy samengevoegd (scripts/render.py), zodat elke body maar één keer gerenderd hoeft te worden.
export const Root: React.FC = () => (
  <>
    {Object.keys(P.hooks).map((key) => {
      const [b, h] = key.split("_h");
      const n = b.slice(1);
      return (
        <React.Fragment key={key}>
          <Composition id={`Body${n}-Hook${h}`} component={FullVideo} durationInFrames={P.hooks[key].frames + P.bodies[b].frames} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ b, h: Number(h) }} />
          <Composition id={`Hook-B${n}-H${h}`} component={HookSegment} durationInFrames={P.hooks[key].frames} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ b, h: Number(h) }} />
        </React.Fragment>
      );
    })}
    {Object.keys(P.bodies).map((b) => (
      <Composition key={b} id={`Body-B${b.slice(1)}`} component={BodySegment} durationInFrames={P.bodies[b].frames} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ b }} />
    ))}
  </>
);

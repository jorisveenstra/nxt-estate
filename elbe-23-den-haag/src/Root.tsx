import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import timing from "./timing.json";
import { BodySegment, HookSegment, VolledigeVideo } from "./Video";

type T = typeof timing;
const hooks = timing.hooks as T["hooks"];
const bodies = timing.bodies as T["bodies"];

// Render-segmenten: één body-segment per body (Body-b1) en één kort hook-segment per variant
// (Hook-b1h2). De pipeline (scripts/render_alles.sh) plakt ze met harde cut aan elkaar en mixt
// de audio. "Body1-Hook2" etc. zijn complete previews met audio voor Remotion Studio.
export const Root: React.FC = () => (
  <>
    {Object.entries(bodies).map(([b, d]) => (
      <Composition key={b} id={`Body-${b}`} component={BodySegment} durationInFrames={d.frames}
        fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b }} />
    ))}
    {Object.entries(hooks).map(([k, d]) => (
      <Composition key={k} id={`Hook-${k}`} component={HookSegment} durationInFrames={d.frames}
        fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ hook: k }} />
    ))}
    {Object.entries(hooks).map(([k, d]) => {
      const b = k.split("h")[0];
      const n = k.split("h")[1];
      return (
        <Composition key={`v${k}`} id={`Body${b.slice(1)}-Hook${n}`} component={VolledigeVideo}
          durationInFrames={d.frames + bodies[b as keyof typeof bodies].frames}
          fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ hook: k }} />
      );
    })}
  </>
);

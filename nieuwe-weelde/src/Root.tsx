import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import scripts from "../scripts/scripts.json";
import { BodyVideo, bodyDuration, HookVideo, hookDuration } from "./Video";

// Body + CTA wordt per body één keer gerenderd; elke hook apart. Daarna: ffmpeg -c copy (scripts/render_alles.py).
export const Root: React.FC = () => (
  <>
    {Object.keys(scripts).flatMap((k) => {
      const b = Number(k.slice(1));
      return [
        <Composition key={`b${b}`} id={`Body${b}`} component={BodyVideo} durationInFrames={Math.ceil(bodyDuration(b) * FPS)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b }} />,
        ...(scripts as any)[k].hooks.map((_: unknown, i: number) => (
          <Composition key={`h${b}-${i + 1}`} id={`Hook${b}-${i + 1}`} component={HookVideo} durationInFrames={Math.ceil(hookDuration(b, i + 1) * FPS)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b, hook: i + 1 }} />
        )),
      ];
    })}
  </>
);

import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { BODIES } from "./config";
import timing from "./timing.json";
import { BodyVideo, bodyFrames, HookVideo, hookFrames } from "./Video";

// Per body één "Body<b>" (gedeeld door alle hooks) en per hook een "Hook<b>-<h>". scripts/render_alles.py zet ze aan elkaar.
export const Root: React.FC = () => (
  <>
    {Object.entries(BODIES).flatMap(([b, n]) => [
      <Composition key={`body-${b}`} id={`Body${b}`} component={BodyVideo} durationInFrames={bodyFrames(Number(b))} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: Number(b) }} />,
      ...Array.from({ length: n }, (_, i) => i + 1)
        .filter((h) => `b${b}h${h}` in timing)
        .map((h) => (
          <Composition key={`${b}-${h}`} id={`Hook${b}-${h}`} component={HookVideo} durationInFrames={hookFrames(Number(b), h)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: Number(b), hook: h }} />
        )),
    ])}
  </>
);

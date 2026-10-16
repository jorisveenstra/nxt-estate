import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import timing from "./timing.json";
import { BodyVideo, HookVideo, bodyFrames, hookFrames } from "./Video";

type T = Record<string, any>;
const tm = timing as T;

// Per body één "Body<b>"-render (relatief aan het begin van de body) en per hook één "Hook<b>-<h>"-render.
export const Root: React.FC = () => (
  <>
    {["b1", "b2", "b3"].flatMap((b) => [
      <Composition key={b} id={`Body${b[1]}`} component={BodyVideo} durationInFrames={bodyFrames(b)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ b }} />,
      ...[1, 2, 3, 4, 5].map((h) => (
        <Composition key={`${b}${h}`} id={`Hook${b[1]}-${h}`} component={HookVideo} durationInFrames={hookFrames(b, h)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ b, h }} />
      )),
    ])}
  </>
);

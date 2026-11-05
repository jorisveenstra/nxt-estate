import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { BodyPart, bodyFrames, FullVideo, fullFrames, HookPart, hookFrames } from "./Parts";

const B = [1, 2, 3];
const H = [1, 2, 3, 4, 5];

export const Root: React.FC = () => (
  <>
    {B.map((b) => (
      <Composition key={`body-${b}`} id={`Body${b}`} component={BodyPart as React.FC<any>} durationInFrames={bodyFrames(b)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b }} />
    ))}
    {B.flatMap((b) =>
      H.map((h) => (
        <Composition key={`hook-${b}-${h}`} id={`Hook${b}-${h}`} component={HookPart as React.FC<any>} durationInFrames={hookFrames(b, h)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b, hook: h }} />
      )),
    )}
    {B.flatMap((b) =>
      H.map((h) => (
        <Composition key={`full-${b}-${h}`} id={`Body${b}-Hook${h}`} component={FullVideo as React.FC<any>} durationInFrames={fullFrames(b, h)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b, hook: h }} />
      )),
    )}
  </>
);

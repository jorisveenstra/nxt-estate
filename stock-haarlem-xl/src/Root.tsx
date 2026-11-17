import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { Body, bodyFrames, Full, Hook, hookFrames } from "./Video";

const B = [1, 2, 3];
const H = [1, 2, 3, 4, 5];

export const RemotionRoot: React.FC = () => (
  <>
    {B.map((b) => (
      <Composition key={`body${b}`} id={`Body${b}`} component={Body} durationInFrames={bodyFrames(b)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b }} />
    ))}
    {B.flatMap((b) =>
      H.map((h) => (
        <Composition key={`hook${b}-${h}`} id={`Hook${b}-${h}`} component={Hook} durationInFrames={hookFrames(b, h)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b, hook: h }} />
      )),
    )}
    {B.flatMap((b) =>
      H.map((h) => (
        <Composition key={`full${b}-${h}`} id={`Body${b}-Hook${h}`} component={Full} durationInFrames={hookFrames(b, h) + bodyFrames(b)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b, hook: h }} />
      )),
    )}
  </>
);

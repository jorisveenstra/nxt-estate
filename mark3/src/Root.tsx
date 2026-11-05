import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { BODIES } from "./config";
import timing from "./timing.json";
import { Mark3Video, getDuration } from "./Video";
export const Root: React.FC = () => (
  <>
    {Object.entries(BODIES).flatMap(([b, n]) =>
      Array.from({ length: n }, (_, i) => i + 1).map((h) => (
        <Composition key={`${b}-${h}`} id={`Body${b}-Hook${h}`} component={Mark3Video} durationInFrames={getDuration(`b${b}h${h}`)}
          fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: Number(b), hook: h }} />
      )),
    )}
  </>
);

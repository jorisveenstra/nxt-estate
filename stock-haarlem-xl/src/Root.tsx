import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH, StockVideo, totalFrames } from "./Video";
import data from "./data.json";

export const Root: React.FC = () => (
  <>
    {[1, 2].flatMap((b) =>
      [1, 2, 3, 4, 5].map((h) => (
        <Composition
          key={`${b}-${h}`}
          id={`Body${b}-Hook${h}`}
          component={StockVideo}
          durationInFrames={totalFrames((data as any)[`b${b}h${h}`])}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ body: b, hook: h }}
        />
      )),
    )}
  </>
);

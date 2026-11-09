import React from "react";
import { Composition } from "remotion";
import { HEIGHT, WIDTH } from "./brand";
import { FPS } from "./config";
import timing from "./timing.json";
import { getDuration, SKVideo } from "./Video";

export const Root: React.FC = () => (
  <>
    {[1, 2, 3, 4, 5].map((h) => (
      <Composition key={h} id={`Body1-Hook${h}`} component={SKVideo} width={WIDTH} height={HEIGHT} fps={FPS}
        durationInFrames={getDuration(h)} defaultProps={{ hook: h }} />
    ))}
  </>
);

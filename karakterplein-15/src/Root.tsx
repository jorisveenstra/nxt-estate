import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import timing from "./timing.json";
import { Segment, segmentFrames } from "./Video";

// Body-segmenten worden één keer per body gerenderd, hook-segmenten per variant; daarna samengevoegd met ffmpeg -c copy.
export const Root: React.FC = () => (
  <>
    {[1, 2, 3].map((b) => (
      <React.Fragment key={b}>
        <Composition id={`Body${b}`} component={Segment} durationInFrames={segmentFrames(`b${b}`, true)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ b, h: 0 }} />
        {[1, 2, 3, 4, 5].map((h) => (
          <Composition key={h} id={`Hook${b}-${h}`} component={Segment} durationInFrames={segmentFrames(`b${b}h${h}`, false)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ b, h }} />
        ))}
      </React.Fragment>
    ))}
  </>
);
void timing;

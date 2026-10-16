import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, TAIL, WIDTH } from "./brand";
import { BODIES } from "./config";
import timing from "./timing.json";
import { BodyVideo, HookVideo } from "./Video";

const T = timing as Record<string, any>;

// Per body één composition (timing relatief aan de start van de body) en per hook één korte composition.
// scripts/render_all.py rendert elke body één keer en plakt hook + body met ffmpeg -c copy aan elkaar.
export const Root: React.FC = () => (
  <>
    {Object.entries(BODIES).flatMap(([b, n]) => [
      <Composition
        key={`b${b}`}
        id={`Body${b}`}
        component={BodyVideo}
        durationInFrames={Math.round((T[`b${b}`].end + TAIL) * FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ body: Number(b) }}
      />,
      ...Array.from({ length: n }, (_, i) => i + 1).map((h) => (
        <Composition
          key={`b${b}h${h}`}
          id={`Hook${b}-${h}`}
          component={HookVideo}
          durationInFrames={Math.round(T[`b${b}h${h}`].hookEnd * FPS)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ body: Number(b), hook: h }}
        />
      )),
    ])}
  </>
);

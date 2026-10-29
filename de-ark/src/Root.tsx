import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import timing from "./timing.json";
import { DeArkVideo, getDuration } from "./Video";

// Eén video per body + hook. Timing komt uit src/timing.json (scripts/lijn_uit.py).
export const Root: React.FC = () => (
  <>
    {Object.keys(timing).flatMap((key) => {
      const [b, h] = key.slice(1).split("h").map(Number);
      const common = { component: DeArkVideo, fps: FPS, width: WIDTH, height: HEIGHT };
      return [
        <Composition key={key} id={`Body${b}-Hook${h}`} {...common} durationInFrames={getDuration(key, FPS)} defaultProps={{ body: b, hook: h, part: "full" as const }} />,
        <Composition key={`${key}-hook`} id={`HookB${b}H${h}`} {...common} durationInFrames={getDuration(key, FPS, "hook")} defaultProps={{ body: b, hook: h, part: "hook" as const }} />,
        ...(h === 1 ? [<Composition key={`${key}-body`} id={`BodyDeel${b}`} {...common} durationInFrames={getDuration(key, FPS, "body")} defaultProps={{ body: b, hook: 1, part: "body" as const }} />] : []),
      ];
    })}
  </>
);

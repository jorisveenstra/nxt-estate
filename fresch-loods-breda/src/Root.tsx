import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { AdVideo, fullFrames, hasTiming, partFrames } from "./Video";

const BODIES = ["b1", "b2"];
const HOOKS = [1, 2, 3, 4, 5];

// Body<b>-Hook<h>: volledige video (studio/controle). Hook-/Body-composities: losse delen voor de snelle render
// (body één keer per body, hook per variant; daarna ffmpeg-concat + audio via scripts/render.py).
export const Root: React.FC = () => (
  <>
    {BODIES.flatMap((b) =>
      HOOKS.filter((h) => hasTiming(`${b}h${h}`)).flatMap((h) => [
        <Composition key={`f${b}${h}`} id={`Body${b.slice(1)}-Hook${h}`} component={AdVideo} durationInFrames={fullFrames(b, `${b}h${h}`)}
          fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b, hook: `${b}h${h}`, part: "full" as const }} />,
        <Composition key={`h${b}${h}`} id={`Hook-${b}-h${h}`} component={AdVideo} durationInFrames={partFrames(`${b}h${h}`)}
          fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b, hook: `${b}h${h}`, part: "hook" as const }} />,
      ]),
    )}
    {BODIES.map((b) => (
      <Composition key={`b${b}`} id={`Body-${b}`} component={AdVideo} durationInFrames={partFrames(b)}
        fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b, hook: `${b}h1`, part: "body" as const }} />
    ))}
  </>
);

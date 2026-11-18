import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { BodySegment, FullVideo, HookSegment, T_ } from "./Video";
import "./brand";

// Hook-<id> en Body-<id> worden los gerenderd en met ffmpeg aan elkaar geplakt (scripts/render.py).
// Body<b>-Hook<h> is de volledige video voor preview in de Studio.
export const Root: React.FC = () => (
  <>
    {Object.entries(T_.hooks).map(([id, h]) => (
      <Composition key={`h${id}`} id={`Hook-${id}`} component={HookSegment} durationInFrames={h.frames} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ id }} />
    ))}
    {Object.entries(T_.bodies).map(([id, b]) => (
      <Composition key={`b${id}`} id={`Body-${id}`} component={BodySegment} durationInFrames={b.frames} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ id }} />
    ))}
    {Object.keys(T_.hooks).map((id) => {
      const body = Number(id[1]);
      const hook = Number(id[3]);
      return (
        <Composition key={`f${id}`} id={`Body${body}-Hook${hook}`} component={FullVideo} durationInFrames={T_.hooks[id].frames + T_.bodies[`b${body}`].frames} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body, hook }} />
      );
    })}
  </>
);

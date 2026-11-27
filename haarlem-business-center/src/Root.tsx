import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { bodyFrames, BodySegment, FullVideo, hookFrames, HookSegment } from "./Video";

// Render: "Hook-b<B>h<H>" (alleen hook) en "Body-b<B>" (één keer per body) -> ffmpeg concat + audio-mix
// (scripts/render.sh). "Body<B>-Hook<H>" is de complete video voor preview in de studio.
const B = [1, 2, 3];
const H = [1, 2, 3, 4, 5];
export const Root: React.FC = () => (
  <>
    {B.map((b) => (
      <Composition key={`body${b}`} id={`Body-b${b}`} component={BodySegment} durationInFrames={bodyFrames(b, FPS)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b }} />
    ))}
    {B.flatMap((b) =>
      H.map((h) => (
        <Composition key={`hook${b}${h}`} id={`Hook-b${b}h${h}`} component={HookSegment} durationInFrames={hookFrames(b, h, FPS)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b, hook: h }} />
      )),
    )}
    {B.flatMap((b) =>
      H.map((h) => (
        <Composition key={`full${b}${h}`} id={`Body${b}-Hook${h}`} component={FullVideo} durationInFrames={hookFrames(b, h, FPS) + bodyFrames(b, FPS)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b, hook: h }} />
      )),
    )}
  </>
);

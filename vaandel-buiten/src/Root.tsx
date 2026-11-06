import React from "react";
import { Composition } from "remotion";
import { BODIES } from "./config";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { BodyVideo, getFrames, HookVideo } from "./Video";

// Per body één compositie "Body<b>" (body + CTA, tijd relatief aan het begin van de body-voice-over) en per hook
// "Body<b>-Hook<h>" (alleen het hook-stuk). scripts/assembleer.py plakt hook + body aan elkaar en voegt voice-over en muziek toe.
export const Root: React.FC = () => (
  <>
    {Object.entries(BODIES).flatMap(([b, n]) => [
      <Composition key={`b${b}`} id={`Body${b}`} component={BodyVideo} durationInFrames={getFrames(`b${b}`)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: Number(b) }} />,
      ...Array.from({ length: n }, (_, i) => i + 1).map((h) => (
        <Composition key={`b${b}h${h}`} id={`Body${b}-Hook${h}`} component={HookVideo} durationInFrames={getFrames(`b${b}h${h}`)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: Number(b), hook: h }} />
      )),
    ])}
  </>
);

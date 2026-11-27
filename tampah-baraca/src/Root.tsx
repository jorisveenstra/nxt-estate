import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { BodyPart, bodyFrames, FullAd, HookPart, hookFrames } from "./Video";

const BODIES = [1, 2, 3];
const HOOKS = [1, 2, 3, 4, 5];

// "Body<b>-Hook<h>": volledige advertentie met audio (Studio/bewerken).
// "Hook-b<b>-h<h>" en "Body-b<b>": losse beeldsegmenten voor de snelle eindrender (scripts/render.py).
export const Root: React.FC = () => (
  <>
    {BODIES.flatMap((b) =>
      HOOKS.map((h) => (
        <Composition key={`f${b}${h}`} id={`Body${b}-Hook${h}`} component={FullAd} durationInFrames={hookFrames(b, h) + bodyFrames(b)}
          fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b, hook: h, audio: true }} />
      )),
    )}
    {BODIES.flatMap((b) =>
      HOOKS.map((h) => (
        <Composition key={`h${b}${h}`} id={`Hook-b${b}-h${h}`} component={HookPart} durationInFrames={hookFrames(b, h)}
          fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b, hook: h }} />
      )),
    )}
    {BODIES.map((b) => (
      <Composition key={`b${b}`} id={`Body-b${b}`} component={BodyPart} durationInFrames={bodyFrames(b)}
        fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b }} />
    ))}
  </>
);

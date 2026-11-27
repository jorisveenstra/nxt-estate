import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { bodyFrames, BodyPart, FullVideo, hookFrames, HookPart } from "./Video";

const BODIES = [1, 2, 3];
const HOOKS = [1, 2, 3, 4, 5];
const common = { fps: FPS, width: WIDTH, height: HEIGHT };

// "Body<b>-Hook<h>": volledige video met audio (preview/bewerken en audiomix).
// "Body<b>" en "Hook<b>-<h>": losse beelddelen; de body wordt één keer gerenderd en achter elke hook geplakt.
export const Root: React.FC = () => (
  <>
    {BODIES.flatMap((b) =>
      HOOKS.map((h) => (
        <Composition key={`f${b}${h}`} id={`Body${b}-Hook${h}`} component={FullVideo} durationInFrames={hookFrames(b, h) + bodyFrames(b)} defaultProps={{ body: b, hook: h }} {...common} />
      )),
    )}
    {BODIES.map((b) => (
      <Composition key={`b${b}`} id={`Body${b}`} component={BodyPart} durationInFrames={bodyFrames(b)} defaultProps={{ body: b }} {...common} />
    ))}
    {BODIES.flatMap((b) =>
      HOOKS.map((h) => (
        <Composition key={`h${b}${h}`} id={`Hook${b}-${h}`} component={HookPart} durationInFrames={hookFrames(b, h)} defaultProps={{ body: b, hook: h }} {...common} />
      )),
    )}
  </>
);

import React from "react";
import { Composition } from "remotion";
import { Full, Segment, plan } from "./Video";

export const Root: React.FC = () => (
  <>
    {Object.entries(plan.segments).map(([k, s]) => (
      <Composition key={k} id={`Seg-${k.replace("_", "-")}`} component={Segment} durationInFrames={s.frames} fps={30} width={1080} height={1920} defaultProps={{ seg: k }} />
    ))}
    {[1, 2, 3].flatMap((b) => [1, 2, 3, 4, 5].map((h) => (
      <Composition key={`${b}-${h}`} id={`Body${b}-Hook${h}`} component={Full}
        durationInFrames={plan.segments[`b${b}_h${h}`].frames + plan.segments[`b${b}`].frames} fps={30} width={1080} height={1920} defaultProps={{ body: b, hook: h }} />
    )))}
  </>
);

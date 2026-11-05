import React from "react";
import { Audio, Composition, Series, staticFile } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import timing from "./timing.json";
import { BodyVideo, HookVideo } from "./Video";

const T = timing as any;
export const Root: React.FC = () => (
  <>
    {Object.entries(T.bodies).map(([b, v]: any) => (
      <Composition key={b} id={`Body${b.slice(1)}`} component={BodyVideo} durationInFrames={v.frames} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body: b }} />
    ))}
    {Object.entries(T.hooks).map(([k, v]: any) => (
      <Composition key={k} id={`Hook-${k}`} component={HookVideo} durationInFrames={v.frames} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ key2: k }} />
    ))}
    {Object.keys(T.hooks).map((k) => {
      const b = k.slice(0, 2);
      return (
        <Composition key={`f${k}`} id={`Full-${k}`} durationInFrames={T.hooks[k].frames + T.bodies[b].frames} fps={FPS} width={WIDTH} height={HEIGHT}
          component={() => (
            <>
              <Series>
                <Series.Sequence durationInFrames={T.hooks[k].frames}><HookVideo key2={k} /></Series.Sequence>
                <Series.Sequence durationInFrames={T.bodies[b].frames}><BodyVideo body={b} /></Series.Sequence>
              </Series>
              <Audio src={staticFile(`vo/${k}.wav`)} />
            </>
          )} />
      );
    })}
  </>
);

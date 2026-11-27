import React from "react";
import { Audio, Composition, Series, staticFile } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { Part, partDuration } from "./Part";

const BODIES = [1, 2, 3];
const HOOKS = [1, 2, 3, 4, 5];

// Volledige advertentie (alleen voor preview in Remotion Studio): hookdeel + bodydeel met voice-over en muziek.
// De definitieve MP4's worden per deel stil gerenderd en met scripts/assembleer.py samengevoegd en gemixt.
const Full: React.FC<{ body: number; hook: number }> = ({ body, hook }) => {
  const h = partDuration({ body, hook }, FPS);
  const b = partDuration({ body, hook: null }, FPS);
  return (
    <>
      <Series>
        <Series.Sequence durationInFrames={h}>
          <Part body={body} hook={hook} />
          <Audio src={staticFile(`vo/b${body}-h${hook}.wav`)} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={b}>
          <Part body={body} hook={null} />
          <Audio src={staticFile(`vo/b${body}-body.wav`)} />
        </Series.Sequence>
      </Series>
      <Audio src={staticFile("muziek/muziek.mp3")} volume={0.12} />
    </>
  );
};

export const Root: React.FC = () => (
  <>
    {BODIES.map((body) => (
      <Composition key={`body${body}`} id={`Body${body}`} component={Part} durationInFrames={partDuration({ body, hook: null }, FPS)}
        fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body, hook: null }} />
    ))}
    {BODIES.flatMap((body) =>
      HOOKS.map((hook) => (
        <Composition key={`h${body}${hook}`} id={`Hook-B${body}-H${hook}`} component={Part} durationInFrames={partDuration({ body, hook }, FPS)}
          fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body, hook }} />
      )),
    )}
    {BODIES.flatMap((body) =>
      HOOKS.map((hook) => (
        <Composition key={`f${body}${hook}`} id={`Body${body}-Hook${hook}`} component={Full}
          durationInFrames={partDuration({ body, hook }, FPS) + partDuration({ body, hook: null }, FPS)}
          fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ body, hook }} />
      )),
    )}
  </>
);

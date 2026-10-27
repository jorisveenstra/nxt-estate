import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, loadFonts, WIDTH } from "./brand";
import plan from "./plan.json";
import { TampahVideo } from "./Video";

// Eén compositie per deel: "b1-h3" (alleen hook) en "b1-body" (body + CTA, één keer per body).
// Beeld zonder audio; scripts/mix.sh plakt hook + body aan elkaar en voegt voice-over + muziek toe.
export const Root: React.FC = () => {
  React.useState(loadFonts);
  return (
  <>
    {Object.entries(plan).map(([id, p]) => (
      <Composition key={id} id={id} component={TampahVideo} durationInFrames={p.frames} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ part: id }} />
    ))}
  </>
  );
};

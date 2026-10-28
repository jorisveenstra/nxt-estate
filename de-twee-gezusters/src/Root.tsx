import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { Segment } from "./Video";
import data from "./data.json";

// Eén compositie per hook en per body; de body wordt één keer gerenderd en met ffmpeg achter elke hook geplakt.
export const Root: React.FC = () => (
  <>
    {Object.entries(data).map(([key, d]) => (
      <Composition key={key} id={key.startsWith("b") && key.includes("h") ? `Hook-${key}` : `Body-${key}`} component={Segment} durationInFrames={(d as { frames: number }).frames} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ k: key }} />
    ))}
  </>
);

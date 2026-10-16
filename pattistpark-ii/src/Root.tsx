import React from "react";
import { Composition, staticFile, continueRender, delayRender } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./brand";
import { bodyFrames, BodyOnly, FullVideo, hookFrames, HookOnly, fullFrames } from "./Video";

const loadFont = () => {
  const h = delayRender("font");
  const faces = [500, 600, 700, 800].map((w) => new FontFace("PoppinsLocal", `url(${staticFile(`fonts/Poppins-${w}.ttf`)})`, { weight: String(w) }).load());
  Promise.all(faces).then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); }).catch((e) => { console.error(e); continueRender(h); });
};
if (typeof document !== "undefined") loadFont();

const B = [1, 2], H = [1, 2, 3, 4, 5];
export const Root: React.FC = () => (
  <>
    {B.flatMap((b) => [
      <Composition key={`body${b}`} id={`Body${b}-Deel`} component={BodyOnly as React.FC<any>} durationInFrames={bodyFrames(b)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ b }} />,
      ...H.flatMap((h) => [
        <Composition key={`hook${b}${h}`} id={`Body${b}-Hook${h}-Deel`} component={HookOnly as React.FC<any>} durationInFrames={hookFrames(b)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ b, h }} />,
        <Composition key={`full${b}${h}`} id={`Body${b}-Hook${h}`} component={FullVideo as React.FC<any>} durationInFrames={fullFrames(b, h)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ b, h }} />,
      ]),
    ])}
  </>
);

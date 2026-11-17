import { continueRender, delayRender, staticFile } from "remotion";

// Huisstijl van stocknederland.nl/haarlem-xl: donker marineblauw, turquoise accent, Montserrat
export const colors = {
  navy: "#112337",
  teal: "#2EBAA5",
  light: "#F5F5F5",
  grey: "#686e77",
  white: "#ffffff",
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FONT = "Montserrat";

// Lokale fonts (public/fonts), geen Google Fonts tijdens het renderen
const handle = delayRender("fonts");
Promise.all(
  [600, 700, 800, 900].map((w) => {
    const f = new FontFace(FONT, `url(${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)}) format("woff2")`, { weight: String(w) });
    return f.load().then((loaded) => document.fonts.add(loaded));
  }),
).then(() => continueRender(handle));

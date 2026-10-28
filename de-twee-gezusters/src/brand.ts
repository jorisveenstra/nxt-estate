import { continueRender, delayRender, staticFile } from "remotion";

// Huisstijl van de-twee-gezusters.afspraakbij.info: warm taupe, crème, donkergroen-zwart, Poppins
export const colors = {
  taupe: "#AF9982",
  cream: "#F8F6F1",
  ink: "#1B221F",
  green: "#345C42",
  white: "#FFFFFF",
};
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FONT = "Poppins, sans-serif";

// Lokale Poppins (geen Google Fonts-fetch tijdens het renderen)
const handle = delayRender("fonts");
Promise.all(
  [500, 600, 700, 800].map((w) => {
    const f = new FontFace("Poppins", `url(${staticFile(`fonts/poppins-latin-${w}-normal.woff2`)})`, { weight: String(w) });
    return f.load().then((l) => document.fonts.add(l));
  }),
).then(() => continueRender(handle)).catch(() => continueRender(handle));

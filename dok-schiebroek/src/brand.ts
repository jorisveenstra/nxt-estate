import { continueRender, delayRender, staticFile } from "remotion";

// Kleuren uit de site (doknederland.nl) en de brochure van Dok Schiebroek
export const colors = {
  khaki: "#898464",
  khakiDark: "#6f6a4f",
  green: "#8dc63f",
  orange: "#f79221",
  blue: "#bdd1d9",
  cream: "#ecead8",
  paper: "#fbfaf7",
  ink: "#1d1d1b",
  white: "#ffffff",
};

// Site: Montserrat (bold voor koppen). Brochure gebruikt Goldplay voor koppen; Montserrat ExtraBold komt dichtbij.
// Montserrat staat lokaal in public/fonts (zelfvoorzienend, geen netwerk nodig bij renderen)
const fontHandle = delayRender("Montserrat laden");
Promise.all(
  [500, 600, 700, 800].map((w) => {
    const f = new FontFace("Montserrat", `url(${staticFile(`fonts/Montserrat-${w}.ttf`)})`, { weight: String(w) });
    return f.load().then(() => document.fonts.add(f));
  }),
)
  .then(() => continueRender(fontHandle))
  .catch((e) => {
    console.error(e);
    continueRender(fontHandle);
  });

export const fonts = { sans: "Montserrat, sans-serif" };

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

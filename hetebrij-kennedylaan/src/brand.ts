import { continueRender, delayRender, staticFile } from "remotion";

// Huisstijl van hetebrijbouw.nl (projectpagina President Kennedylaan): Hetebrij-rood, antraciet, logogrijs, Archivo
export const colors = {
  red: "#C21632",
  ink: "#1E1E1C",
  grey: "#636569",
  light: "#F6F6F6",
  white: "#FFFFFF",
};

// Archivo lokaal (public/fonts), geen Google Fonts-fetch tijdens het renderen
export const FONT = "Archivo";
const weights = ["400", "600", "700", "800"];
if (typeof document !== "undefined") {
  const handle = delayRender("Archivo laden");
  Promise.all(
    weights.map((w) => {
      const f = new FontFace(FONT, `url(${staticFile(`fonts/Archivo-${w}.ttf`)}) format("truetype")`, { weight: w });
      document.fonts.add(f);
      return f.load();
    }),
  ).then(() => continueRender(handle));
}

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

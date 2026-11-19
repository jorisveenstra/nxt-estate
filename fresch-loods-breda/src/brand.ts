import { continueRender, delayRender, staticFile } from "remotion";

// Huisstijl van de projectsite (fresch-loods-breda-versie1.afspraakbij.info):
// LOODS Nederland-logo (goud + wit), goud #BFA349, antraciet #1A1A1A, lettertype Poppins.
export const colors = {
  gold: "#BFA349",
  dark: "#1A1A1A",
  sand: "#E7E2DA",
  white: "#FFFFFF",
};

export const FONT = "Poppins";
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Lokale fonts (public/fonts), geen Google Fonts-verzoek tijdens het renderen
if (typeof document !== "undefined") {
  const handle = delayRender("fonts");
  Promise.all(
    [500, 600, 700, 800].map((w) =>
      new FontFace(FONT, `url(${staticFile(`fonts/Poppins-${w}.woff2`)}) format("woff2")`, { weight: String(w) })
        .load()
        .then((f) => document.fonts.add(f)),
    ),
  ).then(() => continueRender(handle));
}

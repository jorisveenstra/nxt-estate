import { continueRender, delayRender, staticFile } from "remotion";

// Huisstijl Pattistpark II (bron: https://topvast-pattistpark-ii-versie-3.afspraakbij.info en de brochure):
// Poppins, donker groenzwart #1B221F, warm gebroken wit #F8F6F1 en taupe/brons #AF9982 als accent.
export const colors = {
  ink: "#1B221F",
  paper: "#F8F6F1",
  taupe: "#AF9982",
  taupeDark: "#8C7660",
  taupeLight: "#E4D6C4",
  white: "#FFFFFF",
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FONT = "Poppins";

// Lokale lettertypen (public/fonts, OFL) in plaats van Google Fonts tijdens het renderen
const weights = [400, 500, 600, 700, 800];
if (typeof document !== "undefined") {
  const handle = delayRender("Poppins laden");
  Promise.all(
    weights.map((w) => {
      const f = new FontFace(FONT, `url(${staticFile(`fonts/poppins-latin-${w}-normal.woff2`)}) format("woff2")`, {
        weight: String(w),
      });
      return f.load().then((loaded) => document.fonts.add(loaded));
    }),
  ).then(() => continueRender(handle));
}

import { staticFile } from "remotion";

// Huisstijl van singelkwartier-inloopevent.afspraakbij.info en het logo uit de eindkaart:
// diepblauw, zandgoud en koper; Poppins als lettertype (lokaal, geen runtime-download)
export const colors = {
  navy: "#1d293d",
  navyDeep: "#1d3c4c",
  gold: "#af9982",
  goldLight: "#ecd9b4",
  copper: "#a86e4a",
  cream: "#eae4d6",
  white: "#ffffff",
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FONT = "PoppinsSK";

let loaded = false;
export const loadFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  for (const w of [500, 600, 700, 800]) {
    const f = new FontFace(FONT, `url(${staticFile(`fonts/Poppins-${w}.woff2`)}) format("woff2")`, { weight: String(w) });
    f.load().then((ff) => document.fonts.add(ff));
  }
};

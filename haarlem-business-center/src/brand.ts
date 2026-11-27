import { staticFile } from "remotion";

// Huisstijl van haarlem-business-center-versie1.afspraakbij.info: baksteenbruin, goud, saliegroen,
// warm crème en bijna-zwart; lettertype Poppins (lokaal in public/fonts, geen runtime Google Fonts).
export const colors = {
  brown: "#845c3c",
  brownDark: "#5e4029",
  gold: "#bfa349",
  sage: "#b8c4ad",
  cream: "#f6f4ef",
  ink: "#1a1a1a",
  white: "#ffffff",
};

export const FONT = "Poppins";
const faces = [500, 600, 700, 800]
  .map((w) => `@font-face{font-family:'${FONT}';font-weight:${w};font-style:normal;font-display:block;src:url('${staticFile(`fonts/poppins-latin-${w}-normal.woff2`)}') format('woff2');}`)
  .join("\n");
export const fontCss = faces;

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TAIL = 2.5; // s na de laatste body-zin (eindkaart)

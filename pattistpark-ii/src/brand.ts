import { staticFile } from "remotion";

// Huisstijl van https://topvast-pattispark.afspraakbij.info (kleuren uit de CSS, lettertypen Inter/Poppins; Inter lokaal)
export const colors = {
  navy: "#1a2235",
  navy2: "#242e42",
  taupe: "#af9982",
  sand: "#e7e2da",
  orange: "#ed5d25",
  steel: "#57779b",
  white: "#ffffff",
};
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FONT = "InterLocal, Inter, sans-serif";
export const fontCss = [500, 700, 800]
  .map((w, i) => `@font-face{font-family:InterLocal;font-weight:${w};src:url(${staticFile(`fonts/Inter-${["Medium", "Bold", "ExtraBold"][i]}.otf`)});}`)
  .join("");

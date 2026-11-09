import { staticFile } from "remotion";
// Huisstijl Singelkwartier (logo-eindkaart + inloopevent-site): diepblauw, goud/zand, koper; Poppins
export const colors = { navy: "#1a2b3c", navyDeep: "#1d293d", teal: "#1d3c4c", gold: "#b5a272", sand: "#af9982", copper: "#a86e4a", white: "#ffffff" };
export const FONT = "SKPoppins";
export const fontFaces = [500, 700, 800]
  .map((w) => `@font-face{font-family:${FONT};font-weight:${w};src:url(${staticFile(`fonts/Poppins-${w}.ttf`)}) format("truetype");}`)
  .join("\n");
export const WIDTH = 1080;
export const HEIGHT = 1920;

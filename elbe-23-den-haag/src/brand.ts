import { staticFile } from "remotion";

// Huisstijl Business Nomads (elbe-23-den-haag.afspraakbij.info): olijf/brons logo-B, donker groenzwart,
// crème header en Poppins in vette kapitalen voor koppen.
export const colors = {
  olive: "#7b7451", // logo-B en knoppen
  oliveLight: "#8a875e",
  oliveSoft: "#b9b48a",
  dark: "#1b221f",
  cream: "#ebe9d8",
  green: "#1f7a3e", // "NU IN VERKOOP"-label
  white: "#ffffff",
};

export const FONT = "Poppins";
export const fontFaces = [400, 500, 600, 700, 800]
  .map((w) => `@font-face{font-family:'${FONT}';font-weight:${w};font-style:normal;font-display:block;src:url('${staticFile(`fonts/Poppins-${w}.woff2`)}') format('woff2');}`)
  .join("\n");

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

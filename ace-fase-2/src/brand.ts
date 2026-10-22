// Huisstijl van acefase2-amsterdam.afspraakbij.info: crème, saliegroen, staalblauw, bijna-zwart en de oranje accentkleur;
// lettertype Poppins (lokaal in public/fonts, geen runtime-fetch).
import { staticFile } from "remotion";

export const colors = {
  cream: "#eae4d6",
  sage: "#b8c4ad",
  sageDark: "#a3b098",
  steel: "#57779B",
  ink: "#1a1a1a",
  orange: "#FF3C00",
  white: "#ffffff",
};

export const FONT = "Poppins, sans-serif";

export const FONT_CSS = [600, 700, 800, 900]
  .map((w) => `@font-face{font-family:"Poppins";font-weight:${w};src:url(${staticFile(`fonts/Poppins-${w}.ttf`)}) format("truetype");}`)
  .join("\n");

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

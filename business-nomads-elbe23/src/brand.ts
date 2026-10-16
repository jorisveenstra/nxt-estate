// Huisstijl van businessnomads.nl/elbe-23: zwart + taupe uit het BN-logo (#B4AB90), donkerblauw #112337 van de site, Manrope.
import { staticFile } from "remotion";

export const colors = {
  taupe: "#B4AB90",
  taupeLight: "#D9D3C0",
  ink: "#0E0E0E",
  navy: "#112337",
  white: "#FFFFFF",
};

// Lokale fonts (public/fonts), geen runtime-fetch
const faces = [500, 700, 800].map((w) => `@font-face{font-family:"Manrope";font-weight:${w};src:url(${staticFile(`fonts/Manrope-${w}.ttf`)}) format("truetype");}`).join("");
if (typeof document !== "undefined" && !document.getElementById("bn-fonts")) {
  const s = document.createElement("style");
  s.id = "bn-fonts";
  s.textContent = faces;
  document.head.appendChild(s);
}
export const font = '"Manrope", "Helvetica Neue", Arial, sans-serif';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

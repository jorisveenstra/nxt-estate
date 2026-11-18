import { continueRender, delayRender, staticFile } from "remotion";

// djzn ontwikkeling (djzn.nl): zwart slab-serif woordmerk met oranje accent; site gebruikt Rokkitt + Montserrat.
export const colors = {
  orange: "#F39200",
  orangeSoft: "#FFA600",
  ink: "#161718",
  dark: "#262728",
  cream: "#FAFAE1",
  white: "#FFFFFF",
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Lokale fonts (public/fonts), geen runtime Google Fonts
const FONTS: [string, string][] = [
  ["Rokkitt", "fonts/Rokkitt-700.woff2"],
  ["Montserrat", "fonts/Montserrat-800.woff2"],
];
if (typeof document !== "undefined") {
  const handle = delayRender("fonts");
  Promise.all(
    FONTS.map(([family, file]) => {
      const f = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, { weight: "100 900" });
      return f.load().then((l) => document.fonts.add(l));
    }),
  ).then(() => continueRender(handle), () => continueRender(handle));
}
export const fonts = { head: "Rokkitt, serif", sans: "Montserrat, sans-serif" };

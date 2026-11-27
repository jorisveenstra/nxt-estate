import { continueRender, delayRender, staticFile } from "remotion";

// Huisstijl van de Watering-website (djzn-watering-oosthuizen-versie1.afspraakbij.info):
// marineblauw #262D44, okergoud #9A732F, zand #EEE9E2; koppen in Josefin Sans (kapitalen), tekst in Merriweather.
export const colors = {
  navy: "#262D44",
  navyDeep: "#1D2535",
  gold: "#9A732F",
  goldLight: "#E2C98D",
  sand: "#EEE9E2",
  sandDark: "#D4C6AA",
  green: "#345540",
  white: "#FFFFFF",
};

// Lokale lettertypen (public/fonts), geen Google Fonts tijdens het renderen.
export const fonts = { head: "JosefinSans", body: "Merriweather" };

if (typeof document !== "undefined") {
  const handle = delayRender("fonts");
  Promise.all([
    new FontFace("JosefinSans", `url(${staticFile("fonts/JosefinSans.woff2")})`, { weight: "100 700" }).load(),
    new FontFace("Merriweather", `url(${staticFile("fonts/Merriweather.woff2")})`, { weight: "300 900" }).load(),
  ])
    .then((list) => list.forEach((f) => document.fonts.add(f)))
    .finally(() => continueRender(handle));
}

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

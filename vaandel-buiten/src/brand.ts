import { continueRender, delayRender, staticFile } from "remotion";

// Huisstijl van Vaandel Buiten (vaandelbuiten.nl + logo): diep groenblauw schild met wit lettermerk,
// witte/lichtgrijze vlakken (#fff, #f5f5f5, #e7e7e7), donker navy (#373D58) voor knoppen. Website-lettertype: Lato,
// logo-lettermerk: vet geometrisch schreefloos (Poppins ExtraBold komt het dichtst bij). Lettertypen staan lokaal in public/fonts.
export const colors = {
  teal: "#325059",
  tealDark: "#1f3238",
  navy: "#373D58",
  white: "#ffffff",
  paper: "#f5f5f5",
  grey: "#e7e7e7",
  brick: "#d9a55a", // warme baksteentint uit de renders, spaarzaam als accent
  ink: "#16211f",
};

export const fonts = { head: "VB Poppins", body: "VB Lato" };

const faces: [string, string, string][] = [
  [fonts.head, "fonts/poppins-latin-700-normal.woff2", "700"],
  [fonts.head, "fonts/poppins-latin-800-normal.woff2", "800"],
  [fonts.body, "fonts/lato-latin-400-normal.woff2", "400"],
  [fonts.body, "fonts/lato-latin-700-normal.woff2", "700"],
];
const handle = delayRender("fonts");
Promise.all(
  faces.map(([family, file, weight]) => new FontFace(family, `url(${staticFile(file)})`, { weight }).load().then((f) => document.fonts.add(f))),
).then(() => continueRender(handle)).catch(() => continueRender(handle));

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

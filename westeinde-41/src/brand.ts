// Huisstijl DJZN ontwikkeling (bron: https://djzn.nl/westeinde41/ — logo, kleuren en fonts van de projectpagina).
// Logo: zwart "djzn." met oranje punt en "ontwikkeling" in oranje (public/djzn-logo.png, van de website).
// Kleuren: oranje #f39200 (knoppen/accenten op de site), donker #313131 (tekst), wit.
// Fonts: Rokkitt (koppen/menu, slab-serif zoals het logo) en Montserrat (lopende tekst), lokaal in public/fonts.
import { continueRender, delayRender, staticFile } from "remotion";

export const KLEUR = {
  oranje: "#f39200",
  donker: "#313131",
  zwart: "#111111",
  wit: "#ffffff",
  creme: "#fafae1",
};

export const KOP = "Rokkitt, Georgia, serif";
export const TEKST = "Montserrat, Arial, sans-serif";

const fonts: [string, string, string][] = [
  ["Rokkitt", "fonts/Rokkitt-700.ttf", "700"],
  ["Rokkitt", "fonts/Rokkitt-800.ttf", "800"],
  ["Montserrat", "fonts/Montserrat-600.ttf", "600"],
  ["Montserrat", "fonts/Montserrat-800.ttf", "800"],
];

let geladen = false;
export const laadFonts = () => {
  if (geladen || typeof document === "undefined") return;
  geladen = true;
  const h = delayRender("fonts");
  Promise.all(
    fonts.map(([fam, pad, w]) => {
      const f = new FontFace(fam, `url(${staticFile(pad)})`, { weight: w });
      return f.load().then((x) => document.fonts.add(x));
    }),
  )
    .then(() => continueRender(h))
    .catch((e) => {
      console.error(e);
      continueRender(h);
    });
};

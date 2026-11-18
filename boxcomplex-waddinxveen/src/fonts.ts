import { continueRender, delayRender, staticFile } from "remotion";
// Lokale fonts (public/fonts), geen runtime Google Fonts.
const fonts: [string, string, string][] = [
  ["Roboto Condensed", "RobotoCondensed-700.ttf", "700"],
  ["Roboto Condensed", "RobotoCondensed-800.ttf", "800"],
  ["Roboto", "Roboto-500.ttf", "500"],
  ["Roboto", "Roboto-700.ttf", "700"],
];
let loaded = false;
export const loadFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const h = delayRender("fonts");
  Promise.all(fonts.map(([fam, file, w]) => new FontFace(fam, `url(${staticFile("fonts/" + file)})`, { weight: w }).load().then((f) => document.fonts.add(f))))
    .then(() => continueRender(h))
    .catch((e) => { console.error(e); continueRender(h); });
};

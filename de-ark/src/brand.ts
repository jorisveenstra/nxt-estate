import { continueRender, delayRender, staticFile } from "remotion";

// Huisstijl van de projectsite de-ark.afspraakbij.info: diep marineblauw, goud/brons en crème;
// koppen in een serif (Georgia op de site, hier het metrisch gelijke Gelasio), tekst in Josefin Sans.
export const colors = {
  navy: "#182F46",
  deep: "#102638",
  gold: "#b07d37",
  goldLight: "#e2c98d",
  cream: "#eee9e2",
  white: "#ffffff",
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const fonts = { head: "Gelasio", sans: "Josefin Sans" };

const faces: [string, string, string][] = [
  ["Gelasio", "600", "gelasio-latin-600-normal.woff2"],
  ["Gelasio", "700", "gelasio-latin-700-normal.woff2"],
  ["Josefin Sans", "400", "josefin-sans-latin-400-normal.woff2"],
  ["Josefin Sans", "600", "josefin-sans-latin-600-normal.woff2"],
  ["Josefin Sans", "700", "josefin-sans-latin-700-normal.woff2"],
];

// Lokale lettertypes, geen Google Fonts-verzoeken tijdens het renderen
export const loadFonts = () => {
  const handle = delayRender("lettertypes");
  Promise.all(
    faces.map(async ([family, weight, file]) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, { weight });
      await face.load();
      document.fonts.add(face);
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
};

import { continueRender, delayRender, staticFile } from "remotion";

// Huisstijl Haarlem Business Center (brochure + opdracht): donker leisteen, brons/koper, wit.
// Brochure: koppen in hoofdletters in een brede grotesk (Trade Gothic Bold Extended), tekst in Fivo Sans.
// Google-Fonts-equivalenten: Archivo (breed, vet) en Figtree.
export const colors = {
  slate: "#29373D", // opgegeven kleur 1
  slateDeep: "#1c272b",
  slateSoft: "#3a4a51",
  bronze: "#845C3C", // opgegeven kleur 2 (logo-icoon)
  bronzeLight: "#d2a173", // lichtere tint van brons voor tekst op donker (contrast)
  white: "#ffffff",
  cream: "#f3ede6",
};

// Fonts staan lokaal in public/fonts (uit @fontsource), zodat renderen offline werkt.
const load = (family: string, file: string, weight: string) => {
  const handle = delayRender(`font ${family} ${weight}`);
  new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format("woff2")`, { weight, style: "normal" })
    .load()
    .then((f) => {
      document.fonts.add(f);
      continueRender(handle);
    })
    .catch((e) => {
      throw e;
    });
};
["700", "800", "900"].forEach((w) => load("Archivo", `archivo-latin-${w}-normal.woff2`, w));
["500", "600", "700", "800"].forEach((w) => load("Figtree", `figtree-latin-${w}-normal.woff2`, w));

export const fonts = { head: "Archivo, sans-serif", body: "Figtree, sans-serif" };

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

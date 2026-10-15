import { staticFile, continueRender, delayRender } from "remotion";

// Huisstijl van Haarlem Business Center (haarlembusinesscenter.nl + brochure):
// donker leisteen, wit, koper/brons van het logo en oranje als actiekleur van de site.
export const colors = {
  slate: "#29373d",
  slateDark: "#1b262b",
  slateLight: "#3a4b52",
  copper: "#b8804e", // kleur van het gebouw in het logo
  brown: "#845c3c",
  gold: "#cab766",
  orange: "#ff840b", // knoppen op de site
  yellow: "#ffd000",
  grey: "#89949a",
  white: "#ffffff",
  green: "#5fcf8a",
};

// Lettertypen van de site (lokaal meegeleverd): Fivo Sans voor tekst, Trade Gothic Extended voor koppen
export const fonts = { sans: "Fivo Sans", head: "TradeGothic Ext" };

const handle = delayRender("fonts");
Promise.all([
  new FontFace("Fivo Sans", `url(${staticFile("fonts/FivoSans-Bold.woff2")})`, { weight: "700" }).load(),
  new FontFace("Fivo Sans", `url(${staticFile("fonts/FivoSans-Light.woff2")})`, { weight: "300" }).load(),
  new FontFace("TradeGothic Ext", `url(${staticFile("fonts/TradeGothicExt-Bold.woff2")})`, { weight: "700" }).load(),
])
  .then((l) => {
    l.forEach((f) => document.fonts.add(f));
    continueRender(handle);
  })
  .catch(() => continueRender(handle));

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

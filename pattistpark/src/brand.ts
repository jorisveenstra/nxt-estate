import { staticFile } from "remotion";

// Huisstijl van de projectwebsite (topvast-pattispark.afspraakbij.info): diepgroen, warm crème, zandgoud, Poppins.
// De logo's op die site zijn van de makelaars (nxt.estate, Van der Poel), niet van het project; daarom een eigen tekst-woordmerk.
export const colors = {
  green: "#345541", // hsl(142 24% 27%) = --primary
  greenDark: "#1b221e", // hsl(150 12% 12%) = --foreground
  cream: "#f8f6f2", // hsl(40 33% 96%) = --background
  sand: "#ebe5d8", // hsl(40 25% 90%) = --secondary
  gold: "#af9982",
  goldLight: "#e6d6bd",
  white: "#ffffff",
};

// Lokale lettertypes (public/fonts), geen Google Fonts-verzoeken tijdens het renderen
const gewichten = [400, 500, 600, 700, 800];
let geladen = false;
export const laadFonts = () => {
  if (geladen || typeof document === "undefined") return;
  geladen = true;
  gewichten.forEach((w) => {
    const f = new FontFace("Poppins", `url(${staticFile(`fonts/poppins-latin-${w}-normal.woff2`)}) format("woff2")`, { weight: String(w) });
    f.load().then((ff) => document.fonts.add(ff));
  });
};
export const fontFamily = "Poppins, sans-serif";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

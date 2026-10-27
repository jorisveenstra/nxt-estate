import { continueRender, delayRender, staticFile } from "remotion";

// Kleuren uit de brochure van Tampah Beach Villas: olijfbruin, crème en een zandgoud woordmerk
// (de projectsite tampah-beach-villas.afspraakbij.info is een lege JS-pagina met alleen "Tampah Beach Villa's";
// huisstijl is daarom ontleend aan de brochure-kleuren en -lettertypen uit ../tampah-beach-villas)
export const colors = {
  olive: "#52462c",
  oliveDark: "#3b3220",
  cream: "#f1eada",
  sand: "#e3d8c0",
  gold: "#c9b48a",
  goldDark: "#94793f",
  sea: "#2f8ea3",
  ink: "#2a2418",
  white: "#ffffff",
};

// Lokale lettertypen (geen runtime-fetch): Marcellus (kapitalen uit de brochure) en Raleway (site)
export const fonts = { head: "Marcellus", sans: "Raleway" };

export const loadFonts = () => {
  const handle = delayRender("fonts");
  const faces = [300, 500, 600, 700, 800].map((w) => new FontFace("Raleway", `url(${staticFile(`fonts/raleway-latin-${w}-normal.woff2`)})`, { weight: String(w) }));
  faces.push(new FontFace("Marcellus", `url(${staticFile("fonts/marcellus-latin-400-normal.woff2")})`, { weight: "400" }));
  Promise.all(faces.map((f) => f.load().then((l) => document.fonts.add(l)))).then(() => continueRender(handle));
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

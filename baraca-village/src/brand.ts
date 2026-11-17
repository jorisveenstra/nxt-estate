import { continueRender, delayRender, staticFile } from "remotion";

// Huisstijl van de projectwebsite (tampah-beach-villas.afspraakbij.info): Poppins, goud/oker knoppen,
// crème vlakken, diepgroen accent en witte kapitalen op beeld.
export const colors = {
  gold: "#c4923e",
  goldDark: "#9b6e29",
  sand: "#d7b270",
  green: "#397052",
  cream: "#f8f5ef",
  creamDark: "#f1e9db",
  ink: "#161616",
  white: "#ffffff",
};

export const FONT = "Poppins";
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Lokale lettertypen (public/fonts, SIL OFL) in plaats van Google Fonts tijdens het renderen
const gewichten = [400, 500, 600, 700, 800];
if (typeof document !== "undefined") {
  const handle = delayRender("Poppins laden");
  Promise.all(
    gewichten.map((w) => {
      const f = new FontFace(FONT, `url(${staticFile(`fonts/poppins-latin-${w}-normal.woff2`)}) format("woff2")`, {
        weight: String(w),
      });
      return f.load().then((loaded) => document.fonts.add(loaded));
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
}

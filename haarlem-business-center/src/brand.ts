import { staticFile } from "remotion";

// Huisstijl uit haarlembusinesscenter.nl / haarlem-business-center.afspraakbij.info:
// warm bruin (#845C3C, logo), goud (#BFA349), saliegroen (#B8C4AD), crème en bijna-zwart; lettertype Poppins.
export const colors = {
  brown: "#845c3c",
  brownDark: "#5a3d27",
  gold: "#bfa349",
  sage: "#b8c4ad",
  cream: "#f6f4ef",
  sand: "#e7e2da",
  blue: "#57779b",
  ink: "#1a1a1a",
  white: "#ffffff",
};

// Lokale lettertypen (geen runtime Google Fonts-fetch)
const faces = [500, 600, 800].map((w) => {
  const f = new FontFace("Poppins", `url(${staticFile(`fonts/poppins-${w}.ttf`)})`, { weight: String(w) });
  return f;
});
if (typeof document !== "undefined") {
  faces.forEach((f) => f.load().then(() => (document as any).fonts.add(f)));
}
export const fonts = { sans: "Poppins, sans-serif" };

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

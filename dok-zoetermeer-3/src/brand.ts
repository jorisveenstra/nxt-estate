import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";

// Kleuren uit de site (doknederland.nl) en de brochure van Dok Zoetermeer 3
export const colors = {
  khaki: "#898464",
  khakiDark: "#6f6a4f",
  green: "#8dc63f",
  orange: "#f79221",
  blue: "#bdd1d9",
  cream: "#ecead8",
  paper: "#fbfaf7",
  ink: "#1d1d1b",
  white: "#ffffff",
};

// Site: Montserrat (bold voor koppen). Brochure gebruikt Goldplay voor koppen; Montserrat ExtraBold komt dichtbij.
export const fonts = {
  sans: loadMontserrat("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] }).fontFamily,
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadOpenSans } from "@remotion/google-fonts/OpenSans";

// Kleuren van huisunie.nl: donker marineblauw, knopblauw, het lichtblauw van het huisje in het logo
export const colors = {
  navy: "#003061",
  blue: "#154273",
  sky: "#2196F3",
  light: "#f2f4f7",
  grey: "#d0d5dd",
  ink: "#0d0e13",
  white: "#ffffff",
  green: "#22a06b", // vinkjes
};

// Site: Montserrat (koppen, vet) en Open Sans (tekst)
export const fonts = {
  head: loadMontserrat("normal", { weights: ["600", "700", "800", "900"], subsets: ["latin"] }).fontFamily,
  sans: loadOpenSans("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] }).fontFamily,
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

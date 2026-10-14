import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";
import { loadFont as loadRaleway } from "@remotion/google-fonts/Raleway";

// Kleuren uit maartensbusiness.nl en de brochure: donkerrood (logo/knoppen), antraciet en wit
export const colors = {
  red: "#800000",
  redLight: "#a31919",
  ink: "#141414",
  dark: "#1f1f1f",
  grey: "#333333",
  mid: "#7e7e7e",
  light: "#ecebe8", // lichtgrijze achtergrond van de brochurepagina's
  white: "#ffffff",
};

// Site: Raleway (koppen, hoofdletters) en DM Sans (tekst en knoppen)
export const fonts = {
  head: loadRaleway("normal", { weights: ["600", "700", "800", "900"], subsets: ["latin"] }).fontFamily,
  sans: loadDMSans("normal", { weights: ["500", "700", "800"], subsets: ["latin"] }).fontFamily,
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

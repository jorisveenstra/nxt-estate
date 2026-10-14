import { loadFont as loadGelasio } from "@remotion/google-fonts/Gelasio";
import { loadFont as loadInstrument } from "@remotion/google-fonts/InstrumentSans";

// Kleuren uit de site van visscherij-ijmuiden.nl
export const colors = {
  olive: "#6b7a5b",
  oliveDark: "#4f5b43",
  cream: "#f2eee8",
  sand: "#dcd0be",
  red: "#b3292e",
  ink: "#282828",
  white: "#fafafa",
};

// Site: Gelasio voor koppen (serif), Instrument Sans voor tekst
export const fonts = {
  serif: loadGelasio("normal", { weights: ["500", "600", "700"], subsets: ["latin"] }).fontFamily,
  sans: loadInstrument("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] }).fontFamily,
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

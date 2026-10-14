import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

// Kleuren van nxt-estate.com: aubergine, roze markering, crème en zand
export const colors = {
  plum: "#2a1a24",
  plumSoft: "#4a3442",
  pink: "#f5c5d8",
  pinkDeep: "#e79bbb",
  cream: "#faf5ec",
  sand: "#ede3d3",
  white: "#ffffff",
  green: "#2f9e6e",
  red: "#d64550",
};

// Site: Fraunces (koppen, met cursieve accenten) en Inter (tekst en knoppen)
export const fonts = {
  serif: loadFraunces("normal", { weights: ["500", "600", "700"], subsets: ["latin"] }).fontFamily,
  serifItalic: loadFraunces("italic", { weights: ["500", "600", "700"], subsets: ["latin"] }).fontFamily,
  sans: loadInter("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] }).fontFamily,
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

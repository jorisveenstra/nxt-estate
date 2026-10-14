import { loadFont as loadGochi } from "@remotion/google-fonts/GochiHand";
import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as loadMarker } from "@remotion/google-fonts/PermanentMarker";

// Kleuren uit de stylesheet van pepperminds.nl
export const colors = {
  red: "#ff3c3c",
  mint: "#a0d2c8",
  cream: "#fbf4ee",
  blue: "#0052a4",
  black: "#282726",
  white: "#ffffff",
};

// Pepperminds gebruikt Galano Grotesque (betaald) en een handschriftfont.
// Outfit en Permanent Marker zijn de dichtstbijzijnde gratis alternatieven.
// Gochi Hand lijkt op het handschrift van de posters uit de campagne.
export const fonts = {
  heading: loadOutfit("normal", { weights: ["600", "800"], subsets: ["latin"] }).fontFamily,
  hand: loadMarker("normal", { subsets: ["latin"] }).fontFamily,
  poster: loadGochi("normal", { subsets: ["latin"] }).fontFamily,
};

export const FPS = 25;

// Tempo van de muziek onder de postercarrousel (116,9 BPM), in frames per tel.
export const BEAT = 0.5132 * FPS;

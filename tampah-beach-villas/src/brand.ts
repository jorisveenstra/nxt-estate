import { loadFont as loadMarcellus } from "@remotion/google-fonts/Marcellus";
import { loadFont as loadRaleway } from "@remotion/google-fonts/Raleway";

// Kleuren uit de brochure van Tampah Beach Villas: olijfbruin, crème en een zandgoud woordmerk
export const colors = {
  olive: "#52462c",
  oliveDark: "#3b3220",
  cream: "#f1eada",
  sand: "#e3d8c0",
  gold: "#c9b48a",
  goldDark: "#94793f", // goud op crème, voor genoeg contrast
  sea: "#2f8ea3", // turquoise van de lagune, spaarzaam als accent
  ink: "#2a2418",
  white: "#ffffff",
};

// Brochure: klassieke schreefletter in kapitalen (Marcellus komt het dichtst bij); site: Raleway
export const fonts = {
  head: loadMarcellus("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily,
  sans: loadRaleway("normal", { weights: ["300", "500", "600", "700", "800"], subsets: ["latin"] }).fontFamily,
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

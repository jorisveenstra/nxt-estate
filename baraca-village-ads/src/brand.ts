import { continueRender, delayRender, staticFile } from "remotion";

// Website (Poppins, goud #d7b270/#c4923e, groen #397052) + brochure (olijfbruin, crème, Marcellus-woordmerk).
export const colors = {
  gold: "#d7b270",
  goldDeep: "#c4923e",
  green: "#397052",
  olive: "#52462c",
  cream: "#f6f0e2",
  white: "#ffffff",
};
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Lokale fonts (geen runtime-Google-Fonts)
const faces: [string, string, string][] = [
  ["Poppins", "fonts/poppins-latin-500-normal.woff2", "500"],
  ["Poppins", "fonts/poppins-latin-600-normal.woff2", "600"],
  ["Poppins", "fonts/poppins-latin-700-normal.woff2", "700"],
  ["Marcellus", "fonts/marcellus-latin-400-normal.woff2", "400"],
];
export const loadFonts = () => {
  const handle = delayRender("fonts");
  Promise.all(
    faces.map(async ([family, file, weight]) => {
      const f = new FontFace(family, `url(${staticFile(file)})`, { weight });
      await f.load();
      document.fonts.add(f);
    }),
  ).then(() => continueRender(handle));
};

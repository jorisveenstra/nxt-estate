import { continueRender, delayRender, staticFile } from "remotion";

// Huisstijl De Twee Gezusters.
// De opgegeven merkwebsite (de-twee-gezusters-v1.afspraakbij.info) gaf bij productie een 404 en de projectbronnen
// (renders, REAL-beelden, plattegronden) bevatten geen logo of kleurenpalet. Daarom: geen verzonnen logo, alleen de
// projectnaam als tekst, en een rustig palet afgeleid van de projectbeelden zelf (groen park, notenhout, licht interieur).
export const colors = {
  green: "#2E4B3C", // donker parkgroen
  sage: "#4F7A5E", // actief woord / accenten
  leaf: "#A9C29B",
  cream: "#F5F0E6",
  walnut: "#7A4E33",
  white: "#ffffff",
  ink: "#16201A",
};

// Lokale fonts (public/fonts), geen runtime-download van Google Fonts
const FACES: [string, string, string][] = [
  ["DTG Inter", "Inter-Medium.otf", "500"],
  ["DTG Inter", "Inter-SemiBold.otf", "600"],
  ["DTG Inter", "Inter-Bold.otf", "700"],
  ["DTG Inter", "Inter-ExtraBold.otf", "800"],
  ["DTG Display", "InterDisplay-Regular.otf", "400"],
  ["DTG Display", "InterDisplay-Bold.otf", "700"],
];

if (typeof window !== "undefined" && "FontFace" in window) {
  const handle = delayRender("fonts");
  Promise.all(
    FACES.map(([family, file, weight]) =>
      new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, { weight }).load().then((f) => document.fonts.add(f)),
    ),
  ).then(() => continueRender(handle));
}

export const fonts = { sans: "'DTG Inter', sans-serif", display: "'DTG Display', 'DTG Inter', sans-serif" };

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const HOOK_PAUSE = 0.3; // stilte na de hook, vóór de body
export const BODY_TAIL = 2.0; // na de laatste zin

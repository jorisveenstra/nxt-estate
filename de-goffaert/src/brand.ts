import { continueRender, delayRender, staticFile } from "remotion";

// Huisstijl van degoffaert.nl: antraciet (#323132), zand (#AF9982), lichtgrijs (#F5F6F5), terracotta accent.
// Lettertype: Poppins (zoals de inloopevent-site), lokaal geladen uit public/fonts, geen runtime-fetch van Google Fonts.
export const colors = {
  ink: "#323132",
  sand: "#AF9982",
  sandDark: "#917d66",
  light: "#F5F6F5",
  terra: "#C2714F",
  white: "#ffffff",
  green: "#7A8450",
};

export const fonts = { head: "Poppins, sans-serif", sans: "Poppins, sans-serif" };

const handle = delayRender("Poppins laden");
Promise.all(
  [500, 600, 700, 800].map((w) => new FontFace("Poppins", `url(${staticFile(`fonts/Poppins-${w}.ttf`)})`, { weight: String(w) }).load()),
)
  .then((faces) => {
    faces.forEach((f) => document.fonts.add(f));
    continueRender(handle);
  })
  .catch((e) => {
    console.error(e);
    continueRender(handle);
  });

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

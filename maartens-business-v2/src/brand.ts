import { continueRender, delayRender, staticFile } from "remotion";

// Kleuren uit maartensbusiness.nl en de brochure: donkerrood (logo/knoppen), antraciet en wit
export const colors = {
  red: "#800000",
  redLight: "#a31919",
  ink: "#141414",
  dark: "#1f1f1f",
  grey: "#333333",
  mid: "#7e7e7e",
  light: "#ecebe8",
  white: "#ffffff",
};

// Site: Raleway (koppen) en DM Sans (tekst en knoppen). De variabele fonts staan lokaal in public/fonts,
// zodat renderen geen netwerk nodig heeft.
const load = (family: string, file: string) => {
  const handle = delayRender(`font ${family}`);
  new FontFace(family, `url(${staticFile(file)}) format("woff2")`, { weight: "100 900" })
    .load()
    .then((f) => {
      document.fonts.add(f);
      continueRender(handle);
    })
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
  return `"${family}", sans-serif`;
};

export const fonts = {
  head: load("Raleway", "fonts/Raleway.woff2"),
  sans: load("DM Sans", "fonts/DMSans.woff2"),
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

import { staticFile } from "remotion";

// Huisstijl haarlembusinesscenter.nl: bruin (logo #845C3C), goud/zand (#cab766), wit; lettertype Fivo Sans
export const colors = {
  brown: "#845C3C",
  brownDark: "#2b1d12",
  gold: "#cab766",
  goldBright: "#ffd000",
  white: "#ffffff",
};

const face = (w: number, file: string) => {
  const f = new FontFace("Fivo Sans", `url(${staticFile(`fonts/${file}`)}) format("woff2")`, { weight: String(w) });
  f.load().then((l) => document.fonts.add(l));
};
face(300, "FivoSans-300.woff2");
face(700, "FivoSans-700.woff2");

export const font = '"Fivo Sans", "Helvetica Neue", Arial, sans-serif';
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

// Huisstijl: de funda-pagina van de woning was voor de renderserver niet te lezen (bot-controle), dus alleen geverifieerde
// bronnen van dit project: salie-/mintgroen van de gevelbekleding en het baksteenrood uit de foto's, plus de funda-oranje (#F7A100)
// uit de funda-pagina als enkel accent op de CTA-knop.
export const colors = {
  sage: "#6F9A72",
  sageDark: "#2F4A36",
  brick: "#B4533B",
  cream: "#F6F1E7",
  ink: "#16201A",
  white: "#FFFFFF",
  accent: "#F7A100",
};
export const FONT = "KoerInter, Inter, sans-serif";
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Lokale fonts (geen runtime-Google-Fonts)
[["600", "Inter-SemiBold.otf"], ["700", "Inter-Bold.otf"], ["800", "Inter-ExtraBold.otf"], ["900", "Inter-Black.otf"]].forEach(([w, f]) => {
  const h = delayRender("font " + f);
  new FontFace("KoerInter", `url(${staticFile("fonts/" + f)})`, { weight: w })
    .load()
    .then((ff) => { document.fonts.add(ff); continueRender(h); })
    .catch((e) => cancelRender(e));
});

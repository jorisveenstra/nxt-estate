import { continueRender, delayRender, staticFile } from "remotion";

// Huisstijl volgens https://elbe-23-den-haag.afspraakbij.info (Business Nomads):
// Poppins, olijf/khaki accent, bijna-zwart en crème.
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const C = {
  olijf: "#898464",
  olijfLicht: "#B9B48E",
  donker: "#1B221F",
  zwart: "#202119",
  creme: "#ECEAD8",
  cremeLicht: "#F4F2E9",
  wit: "#FFFFFF",
};

export const FONT = "Poppins, sans-serif";

// Lokale fonts (public/fonts), geen runtime Google Fonts.
const handle = delayRender("Poppins laden");
Promise.all(
  [400, 500, 600, 700, 800].map((w) =>
    new FontFace("Poppins", `url(${staticFile(`fonts/Poppins-${w}.woff2`)}) format('woff2')`, {
      weight: String(w),
    })
      .load()
      .then((f) => document.fonts.add(f)),
  ),
)
  .then(() => continueRender(handle))
  .catch((e) => {
    console.error(e);
    continueRender(handle);
  });

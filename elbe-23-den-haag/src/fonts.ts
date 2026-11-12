import { continueRender, delayRender, staticFile } from "remotion";

// Lokale Poppins-bestanden (geen Google Fonts-fetch tijdens het renderen)
const handle = delayRender("Poppins laden");
Promise.all(
  [500, 600, 700, 800].map((w) => {
    const f = new FontFace("Poppins", `url(${staticFile(`fonts/Poppins-${w}.ttf`)}) format("truetype")`, { weight: String(w) });
    return f.load().then((l) => document.fonts.add(l));
  }),
).then(() => continueRender(handle)).catch((e) => { console.error(e); continueRender(handle); });

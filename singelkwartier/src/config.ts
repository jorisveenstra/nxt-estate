import timing from "./timing.json";
import clipInfo from "./clips.json";
import { FPS } from "./brand";

export type Word = [number, number, string];
export const PAUZE = 0.45;
export const TAIL = 1.0; // seconden eindkaart na de laatste woorden

const A = (n: string) => `sk_2026-01-30_${n}.mp4`;
const B = (n: string) => `sk_2026-06-17_${n}.mp4`;
const C = (n: string) => `sk_2026-10-14_${n}.mp4`;

// Echte bouwbeelden uit de bronnenbibliotheek (prefix sk_). Hooks gebruiken een eigen pool,
// de bodies de overige beelden, zodat een shot nooit twee keer in dezelfde video voorkomt.
export const HOOK_CLIPS: Record<string, string[]> = {
  b1h1: [C("01_ruwbouw-overzicht"), B("06_graafmachine-laag")],
  b1h2: [C("06_graafmachine-ruwbouw"), B("02_terrein-hoek-woningen")],
  b1h3: [B("01_bouwrijp-terrein-overzicht"), C("02_ruwbouw-blok-straat")],
  b1h4: [C("07_graafmachines-binnenterrein"), C("01_ruwbouw-overzicht"), B("02_terrein-hoek-woningen")],
  b1h5: [C("05_kraan-bouwplaats"), B("01_bouwrijp-terrein-overzicht")],
  b2h1: [C("05_kraan-bouwplaats"), B("02_terrein-hoek-woningen")],
  b2h2: [C("01_ruwbouw-overzicht"), C("02_ruwbouw-blok-straat")],
  b2h3: [B("01_bouwrijp-terrein-overzicht"), C("06_graafmachine-ruwbouw")],
  b2h4: [C("07_graafmachines-binnenterrein"), B("06_graafmachine-laag")],
  b2h5: [C("06_graafmachine-ruwbouw"), C("05_kraan-bouwplaats")],
};

export const BODY_CLIPS: Record<string, string[]> = {
  b1: [B("03_terrein-achtertuinen"), A("04_bouwterrein-wijk"), C("04_ruwbouw-binnenterrein"), A("01_bouwput-overzicht"), B("05_topdown-straat-terrein"), C("03_vloeren-close"), A("02_bouwput-zijaanzicht"), B("04_graafmachine-van-boven"), A("05_bouwterrein-straat"), B("08_topdown-terrein"), A("03_grondwal-close"), B("07_graafmachines-sleuf")],
  b2: [A("05_bouwterrein-straat"), B("05_topdown-straat-terrein"), C("03_vloeren-close"), A("04_bouwterrein-wijk"), B("08_topdown-terrein"), A("01_bouwput-overzicht"), C("04_ruwbouw-binnenterrein"), B("07_graafmachines-sleuf"), A("02_bouwput-zijaanzicht"), B("03_terrein-achtertuinen"), A("03_grondwal-close"), B("04_graafmachine-van-boven")],
};

export const END_CARD = "sk_eindkaart-logo.mp4";

// Korte kaders (a_lot, maar klein): zoek in de body het eerste woord dat met `w` begint
export type Callout = { w: string; text: string; icon: "pin" | "home" | "check" | "box" | "car" | "wave" | "euro" | "key" | "ruler" };
export const CALLOUTS: Record<string, Callout[]> = {
  b1: [
    { w: "dishoeckstraat", text: "Hoek Singel / Van Dishoeckstraat", icon: "pin" },
    { w: "gestart", text: "Bouw gestart", icon: "check" },
    { w: "drie-", text: "3- en 4-kamerappartementen", icon: "home" },
    { w: "eenentachtig", text: "Circa 81 – 141 m²", icon: "ruler" },
    { w: "privéberging", text: "Eigen privéberging", icon: "box" },
    { w: "parkeerplaats", text: "Eigen parkeerplaats", icon: "car" },
    { w: "loopafstand", text: "Centrum en winkels op loopafstand", icon: "pin" },
    { w: "uitwaaien", text: "Zee op loopafstand", icon: "wave" },
    { w: "driehonderdveertigduizend", text: "Vanaf € 340.000 v.o.n.", icon: "euro" },
  ],
  b2: [
    { w: "singelkwartier,", text: "Singelkwartier Vlissingen", icon: "pin" },
    { w: "openbaar", text: "Winkels en OV om de hoek", icon: "pin" },
    { w: "zee", text: "Zee op loopafstand", icon: "wave" },
    { w: "begane", text: "Ook op de begane grond", icon: "home" },
    { w: "parkeerplaats", text: "Eigen parkeerplaats", icon: "car" },
    { w: "berging", text: "Eigen berging", icon: "box" },
    { w: "gestart,", text: "Bouw gestart", icon: "check" },
    { w: "driehonderdveertigduizend", text: "Vanaf € 340.000 v.o.n.", icon: "euro" },
    { w: "hypotheekgesprek.", text: "Vrijblijvend hypotheekgesprek", icon: "key" },
  ],
};

export const clipFrames = (f: string) => Math.round((clipInfo as Record<string, number>)[f] * FPS);
export const secToF = (s: number) => Math.round(s * FPS);

export const bodyData = (b: number) => timing.bodies[`b${b}` as "b1"] as { words: Word[]; ctaStart: number; bodyDur: number };
export const hookData = (b: number, h: number) => timing.hooks[`b${b}h${h}` as "b1h1"] as { hookEnd: number; words: Word[] };
export const hookFrames = (b: number, h: number) => secToF(hookData(b, h).hookEnd + PAUZE);
export const bodyFrames = (b: number) => Math.ceil((bodyData(b).bodyDur + TAIL) * FPS);

// Hard cuts: opeenvolgende clips tot `total` frames; de laatste wordt afgekapt.
export const buildCuts = (list: string[], total: number) => {
  const cuts: { file: string; from: number; dur: number }[] = [];
  let t = 0;
  let i = 0;
  while (t < total) {
    const file = list[i % list.length];
    const dur = Math.min(clipFrames(file), total - t);
    cuts.push({ file, from: t, dur });
    t += dur;
    i++;
  }
  return cuts;
};

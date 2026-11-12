// Welke clip (foto-nummer uit de Bronnenbibliotheek, public/clips/fotoNN.mp4) bij welke hook/zin,
// plus de grafische accenten per zin. Alleen harde cuts tussen shots.
export type Callout =
  | { kind: "stat"; kicker?: string; big: string; sub?: string }
  | { kind: "chips"; kicker?: string; chips: string[]; sub?: string }
  | { kind: "cta" };

export type BodyCfg = { hookClips: number[]; shots: number[][]; callouts: Callout[] };

export const PAUSE = 0.35; // s stilte tussen hook en body
export const TAIL = 1.6; // s na de laatste zin

export const BODIES: Record<number, BodyCfg> = {
  1: {
    hookClips: [3, 9, 12, 10, 2],
    shots: [[1, 5], [10], [4], [7], [2], [8], [13, 9], [11], [12]],
    callouts: [
      { kind: "stat", kicker: "Eigen bedrijfsunit", big: "Vanaf € 505.000", sub: "v.o.n. · Forepark Den Haag" },
      { kind: "stat", kicker: "Geen huurbaas meer", big: "Jouw eigen pand" },
      { kind: "stat", kicker: "Units van", big: "ca. 202–230 m²", sub: "Over 2 of 3 verdiepingen" },
      { kind: "stat", kicker: "Per unit", big: "2–3 eigen parkeerplaatsen" },
      { kind: "chips", kicker: "Direct aan de", chips: ["A12", "A4"], sub: "Rotterdam · Leiden · Zoetermeer" },
      { kind: "chips", kicker: "Bouwkwaliteit", chips: ["Betonnen casco", "HR++ glas", "Eigentijdse gevel"] },
      { kind: "stat", kicker: "Oplevering gepland", big: "Q4 2027" },
      { kind: "stat", kicker: "Financiering?", big: "Financieel adviseur", sub: "Betrokken bij het project" },
      { kind: "cta" },
    ],
  },
  2: {
    hookClips: [5, 9, 13, 7, 4],
    shots: [[1, 4], [8, 7], [6], [3], [10], [5], [2], [12, 13]],
    callouts: [
      { kind: "chips", kicker: "Alles onder één dak", chips: ["Werkplaats", "Opslag", "Kantoor"], sub: "Vanaf € 505.000 v.o.n." },
      { kind: "stat", kicker: "Begane grond", big: "ca. 74–117 m²", sub: "Voor werkplaats en materiaal" },
      { kind: "stat", kicker: "Overheaddeur tot", big: "ca. 4,4 × 3,2 m" },
      { kind: "chips", kicker: "Op de verdieping", chips: ["Kantoor", "Extra opslag"] },
      { kind: "chips", kicker: "Robuust casco", chips: ["Prefab beton & staal", "Betonnen vloeren"] },
      { kind: "stat", kicker: "Je bus voor de deur", big: "2–3 eigen parkeerplaatsen" },
      { kind: "chips", kicker: "Snel bij je klanten", chips: ["A12", "A4"], sub: "Binnen enkele minuten de regio in" },
      { kind: "cta" },
    ],
  },
  3: {
    hookClips: [2, 9, 10, 4, 12],
    shots: [[1, 4], [3, 10], [9], [11], [8], [2], [7], [13], [12]],
    callouts: [
      { kind: "stat", kicker: "Nieuwbouw bedrijfsvastgoed", big: "Vanaf € 505.000", sub: "v.o.n. · Forepark Den Haag" },
      { kind: "stat", kicker: "Kleinschalig project", big: "Slechts 14 units", sub: "ca. 202–230 m² · Punkt Architecture" },
      { kind: "chips", kicker: "Flexibel in te richten", chips: ["Kantoor", "Studio", "Bedrijfsruimte"] },
      { kind: "chips", kicker: "Geschikt voor", chips: ["Eigen gebruik", "Verhuur"] },
      { kind: "chips", kicker: "Bouwkwaliteit", chips: ["Prefab beton & staal", "HR++ glas", "Geïsoleerde gevel"] },
      { kind: "chips", kicker: "Voorbereid op", chips: ["Warmtepomp", "Zonnepanelen"] },
      { kind: "stat", kicker: "2–3 parkeerplaatsen per unit", big: "A12 & A4", sub: "Op enkele minuten" },
      { kind: "stat", kicker: "Oplevering gepland", big: "Q4 2027" },
      { kind: "cta" },
    ],
  },
};

// Shotlijst. Clips: public/clips/fotoNN.mp4 = native 1080x1920 Veo 3.1-clips uit de Bronnenbibliotheek
// (zie clips-provenance.json). Tijden in seconden; body relatief aan begin body, hook vanaf 0.
export type Shot = { clip: string; from: number; at?: number }; // at = clipoffset in s

export const BODY_SHOTS: Record<string, Shot[]> = {
  b1: [
    { clip: "foto01", from: 0 },
    { clip: "foto03", from: 4.6 },
    { clip: "foto06", from: 9.24 },
    { clip: "foto08", from: 12.8 },
    { clip: "foto05", from: 16.3 },
    { clip: "foto11", from: 19.84 },
    { clip: "foto07", from: 24.24 },
    { clip: "foto04", from: 27.4 },
    { clip: "foto02", from: 30.64 },
    { clip: "foto10", from: 36.8 },
    { clip: "foto09", from: 40.5 },
    { clip: "foto12", from: 44.16 },
    { clip: "foto13", from: 50.56 },
  ],
};

// Per hook twee shots; de tweede snijdt op ~45% van de hook in.
export const HOOK_SHOTS: Record<string, [string, string]> = {
  b1h1: ["foto08", "foto06"],
  b1h2: ["foto04", "foto07"],
  b1h3: ["foto09", "foto03"],
  b1h4: ["foto05", "foto10"],
  b1h5: ["foto07", "foto12"],
};

export const HOOK_KICKERS: Record<string, string[]> = {
  b1h1: ["Garage of", "autobedrijf?"],
  b1h2: ["Werkplaats", "te krap?"],
  b1h3: ["Klaar met", "huur betalen?"],
  b1h4: ["Detailing of", "banden?"],
  b1h5: ["Werkplaats +", "overheaddeur?"],
};

// Woorden die in de ondertitel een olijf accent krijgen
export const ACCENT = [
  "overheaddeur", "eigen", "garage", "autobedrijf", "werkplaats", "bedrijfspand", "bedrijfsunit",
  "parkeerplaatsen", "Elbe", "23", "Forepark", "117", "m²", "A12", "A4", "veertien", "2027",
  "kantoor", "beton", "staal", "detailing-", "bandenbedrijf", "makelaar", "klanten",
];

export const PAUSE_TAIL = 1.4; // stilte/eindbeeld na de laatste zin

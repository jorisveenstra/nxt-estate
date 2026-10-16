// Beeldkeuze. Clip-nummers verwijzen naar public/clips/pNN.mp4 (zie scripts/source-images.json voor de bronfoto's).
// Per scène één of twee clips; bij een lange scène wordt halverwege hard doorgesneden.
export const BODIES: Record<number, number> = { 1: 5, 2: 5, 3: 5 };

export const SCENE_CLIPS: Record<number, Record<string, number[]>> = {
  1: { s1: [3, 5], s2: [12, 4], s3: [14, 6, 7, 10], s4: [13, 8], s5: [8, 13], s6: [1, 0], s7: [11, 9], s8: [15, 3], c1: [5], c2: [2] },
  2: { s1: [1, 0], s2: [7, 6], s3: [12, 4], s4: [14, 15], s5: [10, 9], s6: [0, 14], s7: [4, 11], c1: [3], c2: [2] },
  3: { s1: [0, 3], s2: [11, 12], s3: [2, 6], s4: [13, 8], s5: [8, 13], s6: [1, 5], c1: [15], c2: [2] },
};

export const HOOK_CLIPS: Record<number, Record<number, number>> = {
  1: { 1: 0, 2: 6, 3: 7, 4: 12, 5: 8 },
  2: { 1: 2, 2: 6, 3: 7, 4: 10, 5: 15 },
  3: { 1: 2, 2: 6, 3: 7, 4: 1, 5: 13 },
};

// Feitelijke callouts (medium grafisch niveau): verschijnen bij een woord in de scène
export const CALLOUTS: Record<number, { scene: string; word: number; icon: string; title: string; sub?: string }[]> = {
  1: [
    { scene: "s1", word: 11, icon: "pin", title: "Aan Het Spaarne", sub: "Haarlem" },
    { scene: "s3", word: 3, icon: "units", title: "41 huurunits", sub: "kantoor, atelier, werkplaats, hal" },
    { scene: "s4", word: 7, icon: "sun", title: "Lunchroom + dakterras", sub: "bovenste verdieping" },
    { scene: "s6", word: 6, icon: "pin", title: "± 1 km van het centrum", sub: "A9 · A5 · A2 · A10" },
    { scene: "s7", word: 2, icon: "car", title: "148 parkeerplaatsen", sub: "waarvan 16 met laadpunt" },
    { scene: "s8", word: 5, icon: "key", title: "Oplevering november 2026" },
    { scene: "c1", word: 2, icon: "units", title: "10 van 41 units verhuurd" },
  ],
  2: [
    { scene: "s2", word: 11, icon: "units", title: "± 120 m²", sub: "over twee lagen" },
    { scene: "s4", word: 15, icon: "pin", title: "Kantoorunit 4e verdieping", sub: "eigen voordeur · plafonds van 3 m" },
    { scene: "s5", word: 7, icon: "units", title: "3 grote hallen", sub: "zwaar belastbare vloeren" },
    { scene: "s6", word: 4, icon: "leaf", title: "HR++ glas · warmtepomp", sub: "zonnepanelen optioneel" },
    { scene: "s7", word: 3, icon: "key", title: "Goederenlift · hellingbaan", sub: "24/7 camerabewaking" },
    { scene: "c1", word: 4, icon: "key", title: "Oplevering november 2026" },
  ],
  3: [
    { scene: "s1", word: 18, icon: "pin", title: "Aan Het Spaarne", sub: "Haarlem" },
    { scene: "s2", word: 9, icon: "car", title: "148 parkeerplaatsen", sub: "+ fietsenstalling met laders" },
    { scene: "s3", word: 3, icon: "units", title: "Entree met personenlift", sub: "veel ramen, licht en uitzicht" },
    { scene: "s4", word: 8, icon: "sun", title: "Restaurant met dakterras" },
    { scene: "s6", word: 5, icon: "pin", title: "± 1 km van het centrum" },
  ],
};

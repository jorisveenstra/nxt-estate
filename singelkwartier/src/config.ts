// Footage-first montage. Alle clips zijn native 1080x1920. R = AI-render (veo), V = echte bouwvideo.
// Verhouding ~60% video / 40% art impressie. Geen carport/overdekt parkeren.
export const FPS = 30;
export const END_CARD = { clip: "2331ae2a", dur: 3 };
export const HOOK_PAUSE_TAIL = 0; // body begint direct na hook + pauze
export type Slot = { clip: string; from: number; to: number; start?: number }; // from/to: seconden t.o.v. body-start; start: offset in clip
export const HOOK_CLIPS: Record<number, { clip: string; frac: [number, number] }[]> = {
  1: [{ clip: "1906258a", frac: [0, 1] }],
  2: [{ clip: "2a71f160", frac: [0, 0.55] }, { clip: "d5e7a6dd", frac: [0.55, 1] }],
  3: [{ clip: "e81605dc", frac: [0, 1] }],
  4: [{ clip: "ff742275", frac: [0, 0.5] }, { clip: "179823c9", frac: [0.5, 1] }],
  5: [{ clip: "d73d6b8f", frac: [0, 0.5] }, { clip: "baf44821", frac: [0.5, 1] }],
};
export const BODY_SLOTS: Slot[] = [
  { clip: "6eae0d40", from: 0, to: 5.36 }, // R hoekgebouw
  { clip: "f3322382", from: 5.36, to: 8.4 },
  { clip: "2fca9745", from: 8.4, to: 10.9 },
  { clip: "5b6d1ec7", from: 10.9, to: 13.31 },
  { clip: "d9257094", from: 13.31, to: 16.4 },
  { clip: "32d6bf81", from: 16.4, to: 19.0 },
  { clip: "b262e598", from: 19.0, to: 21.52 }, // R kruispunt
  { clip: "90d2067d", from: 21.52, to: 25.76 },
  { clip: "81de8420", from: 25.76, to: 30.24 }, // R voorgevel
  { clip: "6b592f1e", from: 30.24, to: 34.4 }, // R voorgevel avond
  { clip: "a8fc81e0", from: 34.4, to: 36.96 },
  { clip: "7cdc90b0", from: 36.96, to: 41.6 },
  { clip: "81de8420", from: 41.6, to: 45.1, start: 4.4 }, // R voorgevel (tweede deel)
  { clip: "c5d346d8", from: 45.1, to: 48.8 },
];
export const RENDER_CLIPS = ["6eae0d40", "b262e598", "81de8420", "6b592f1e"];
// Korte accenten (tekst) op body-tijd: [van, tot, regel1, regel2?]
export const ACCENTS: [number, number, string, string?][] = [
  [0.6, 4.6, "Singelkwartier", "Scheldekwartier · Vlissingen"],
  [6.0, 11.5, "Water om je heen", "Industrieel erfgoed"],
  [14.0, 20.0, "Horeca · evenementen · groen", "Dokter Stumphiuspark"],
  [22.0, 25.2, "De bouw is gestart"],
  [26.2, 30.0, "Eigen parkeerplaats", "+ privé-berging inbegrepen"],
  [30.6, 34.2, "Vanaf € 340.000", "vrij op naam"],
  [37.2, 41.4, "Vrijblijvend hypotheekgesprek", "bij je inschrijving"],
  [42.0, 48.4, "Schrijf je in", "Bekijk de beschikbare appartementen"],
];

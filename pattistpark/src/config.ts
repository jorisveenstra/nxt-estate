// Beeldkeuze. Hook-clip per hook; de body-scènes delen één reeks. Harde knip tussen alle clips, geen overgangen.
export const HOOKS = 5;

export const HOOK_CLIP: Record<number, string> = {
  1: "h1-appartement-woonkamer", // trap wordt een klus -> gelijkvloers interieur
  2: "h2-appartement-eetkamer", // gelijkvloers wonen
  3: "h3-wijk-zeeland", // eengezinswoning, Zeeuwse wijk
  4: "h4-park-toren", // verhuizen / verkopen
  5: "h5-dijk-water", // Terneuzen, uitzicht
};

// [clip, eerste scène, laatste scène] voor de body
export const BODY_SEGMENTS: [string, string, string][] = [
  ["b1-zonsondergang", "dit", "dit"],
  ["b4-keuken", "gelijkvloers", "gelijkvloers"],
  ["b3-kust", "uitzicht", "uitzicht"],
  ["b5-luchtfoto", "oplevering", "oplevering"],
  ["b2-balkon", "mooiste", "zorgeloos"],
  ["b1-zonsondergang", "cta", "cta"],
];

// Gemarkeerde (goud gekleurde) woorden in de hooks
export const HOOK_ACCENT: Record<number, string[]> = {
  1: ["trap", "klus?"],
  2: ["gelijkvloers", "Zeeland"],
  3: ["Zeeuwse", "groter"],
  4: ["verhuizen,", "verkocht"],
  5: ["Terneuzen,", "uitzicht", "voorzieningen"],
};

// Beeldkeuze. Harde knip tussen alle clips, geen overgangen.
export const HOOKS = 5;
export const BODIES = [1, 2];

export const HOOK_CLIP: Record<number, Record<number, string>> = {
  1: {
    1: "h1-appartement-woonkamer", // trap wordt een klus -> gelijkvloers interieur
    2: "h2-appartement-eetkamer", // gelijkvloers wonen
    3: "h3-wijk-zeeland", // eengezinswoning, Zeeuwse wijk
    4: "h4-park-toren", // verhuizen / verkopen
    5: "h5-dijk-water", // Terneuzen, uitzicht
  },
  2: {
    1: "h3-wijk-zeeland", // dorp, alles met de auto
    2: "h5-dijk-water", // alles dichtbij in Terneuzen
    3: "h4-park-toren", // Pattistpark II
    4: "h1-appartement-woonkamer", // gelijkvloers met uitzicht
    5: "h5-dijk-water", // dichter bij de stad
  },
};

// [clip, eerste scène, laatste scène] voor de body
export const BODY_SEGMENTS: Record<number, [string, string, string][]> = {
  1: [
    ["b1-zonsondergang", "dit", "dit"],
    ["b4-keuken", "gelijkvloers", "gelijkvloers"],
    ["b3-kust", "uitzicht", "uitzicht"],
    ["b5-luchtfoto", "oplevering", "oplevering"],
    ["b2-balkon", "mooiste", "zorgeloos"],
    ["b1-zonsondergang", "cta", "cta"],
  ],
  2: [
    ["b1-zonsondergang", "dan", "dan"],
    ["b5-luchtfoto", "centrum", "centrum"],
    ["b4-keuken", "gelijkvloers", "gelijkvloers"],
    ["b2-balkon", "uitzicht", "uitzicht"],
    ["h2-appartement-eetkamer", "prijs", "verkocht"],
    ["b3-kust", "regio", "regio"],
    ["b1-zonsondergang", "cta", "cta"],
  ],
};

// Gemarkeerde (goud gekleurde) woorden in de hooks
export const HOOK_ACCENT: Record<number, Record<number, string[]>> = {
  1: {
    1: ["trap", "klus?"],
    2: ["gelijkvloers", "Zeeland"],
    3: ["Zeeuwse", "groter"],
    4: ["verhuizen,", "verkocht"],
    5: ["Terneuzen,", "uitzicht", "voorzieningen"],
  },
  2: {
    1: ["Zeeuws-Vlaanderen", "auto?"],
    2: ["dichtbij", "Terneuzen,", "kan."],
    3: ["Pattistpark", "II?", "Westerschelde."],
    4: ["Gelijkvloers", "water", "Terneuzen."],
    5: ["dichter", "Zeeland"],
  },
};

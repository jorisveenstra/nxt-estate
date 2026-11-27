// Beeldkeuze per body/hook en graphics per zin.
// Shot-lijst: [clip, woord waarop naar deze clip geknipt wordt]; de eerste van een zin heeft null (knip op zinsbegin).
// Alleen harde knippen, geen overgangen. "ai-…" = bestaande Veo-renderclips uit de Bronnenbibliotheek (impressie),
// "real-…" = REAL-opnames van het project, cover-fit staand uitgesneden.
export type ShotList = [string, string | null][];
export type Gfx =
  | { type: "title" }
  | { type: "chip"; icon: IconName; text: string }
  | { type: "list"; icon: IconName; items: [string, string][] } // [tekst, woord waarop het verschijnt]
  | { type: "route"; text: string; sub: string }
  | { type: "cta"; text: string; sub: string };
export type IconName = "leaf" | "pin" | "check" | "home" | "heart" | "chat" | "calendar" | "search" | "star" | "key";

export const HOOK_LABEL: Record<number, string> = {
  1: "Wonen in het groen · Roosendaal",
  2: "Penthouses · Roosendaal",
  3: "Wonen in je eigen regio",
};

export const HOOK_SHOTS: Record<number, Record<number, ShotList>> = {
  1: {
    1: [["ai-sophie", null], ["real-woonkamer", "voelt"]],
    2: [["ai-woonkamer", null], ["real-drone-vijver-2", "met"]],
    3: [["real-panorama-2", null], ["ai-eetkamer", "maar"]],
    4: [["real-drone-bomen", null], ["ai-sophie", "appartement"], ["real-terras-pui", "denkt"]],
    5: [["real-vijver", null], ["real-panorama", "strategisch"]],
  },
  2: {
    1: [["ai-sabine", null], ["real-panorama-2", "maar"]],
    2: [["real-balkon-park", null], ["real-drone-vijver-2", "met"]],
    3: [["real-terras-pui", null], ["real-drone-groen", "en"]],
    4: [["ai-woonkamer", null], ["real-gebouw-vijver", "heeft"]],
    5: [["real-balkon-gevel", null], ["ai-sierhaver", "met"]],
  },
  3: {
    1: [["real-panorama", null], ["real-woonkamer-push", "maar"]],
    2: [["real-drone-groen", null], ["ai-woonruimte", "zonder"]],
    3: [["real-panorama-2", null], ["real-drone-vijver", "comfortabel"]],
    4: [["real-park", null], ["real-balkon-park", "familie"]],
    5: [["ai-sophie", null]],
  },
};

// Woorden die in de hook-ondertitels extra nadruk krijgen
export const HOOK_ACCENT: Record<number, string[]> = {
  1: ["groot", "groen", "comfortabel", "past", "eengezinswoning", "strategisch", "rustig"],
  2: ["penthouse", "groen", "bovenin", "strategisch", "gezien"],
  3: ["regio", "roosendaal", "groen", "familie", "vrienden", "resultaat", "gezusters"],
};

export const BODY_SHOTS: Record<number, Record<string, ShotList>> = {
  1: {
    intro: [["real-gebouw-vijver", null]],
    groen: [["ai-sophie", null], ["real-park", "groen"]],
    situatie: [["real-woonkamer-push", null]],
    kwaliteit: [["ai-woonkamer", null], ["ai-keuken", "zonder"]],
    comfort: [["ai-woonruimte", null], ["real-woonkamer-pui", "appartement"]],
    ligging: [["real-panorama", null], ["real-drone-water", "plek"]],
    onderweg: [["real-drone-vijver", null], ["real-balkon-park", "vrienden"]],
    vragen: [["ai-eetkamer", null], ["real-terras-hoek", "prijzen"]],
    persoonlijk: [["real-terras-pui", null]],
    cta: [["ai-sierhaver", null]],
  },
  2: {
    intro: [["real-drone-water", null]],
    groen: [["ai-sabine", null], ["real-balkon-park", "groen"]],
    schaars: [["real-panorama-2", null], ["ai-woonkamer", "niet"]],
    comfort: [["ai-eetkamer", null], ["ai-keuken", "appartement"]],
    ligging: [["real-panorama", null], ["real-drone-groen", "plek"]],
    combinatie: [["real-terras-pui", null], ["real-drone-vijver", "gemak"]],
    indeling: [["real-woonkamer-pui", null], ["ai-woonruimte", "ingedeeld"]],
    prijzen: [["real-schuifpui", null]],
    persoonlijk: [["real-balkon-gevel", null]],
    cta: [["ai-sophie", null]],
  },
  3: {
    intro: [["real-gebouw-vijver", null]],
    groen: [["ai-sophie", null], ["real-drone-vijver", "gewoon"]],
    schaars: [["real-panorama-2", null], ["real-drone-park", "maar"]],
    blijven: [["ai-sierhaver", null], ["real-vijver", "andere"]],
    dichtbij: [["real-park", null], ["real-balkon-park", "plekken"]],
    comfort: [["ai-woonkamer", null], ["ai-keuken", "appartement"]],
    ligging: [["real-panorama", null], ["real-drone-water", "plek"]],
    moment: [["real-woonkamer", null]],
    planning: [["ai-eetkamer", null], ["real-terras-hoek-2", "zodat"]],
    cta: [["ai-sabine", null]],
  },
};

const CTA: Gfx = { type: "cta", text: "Plan een afspraak", sub: "Alle informatie via de knop hieronder" };
const ROUTE: Gfx = { type: "route", text: "Strategisch gelegen", sub: "Logistiek goed bereikbaar" };
const COMFORT: Gfx = { type: "chip", icon: "check", text: "Wooncomfort centraal" };

export const BODY_GFX: Record<number, Record<string, Gfx>> = {
  1: {
    intro: { type: "title" },
    groen: { type: "chip", icon: "leaf", text: "Groen om u heen" },
    situatie: { type: "chip", icon: "home", text: "Huis te groot geworden?" },
    kwaliteit: { type: "list", icon: "check", items: [["Prettig wonen", "prettig"], ["Kwaliteit behouden", "kwaliteit"]] },
    comfort: COMFORT,
    ligging: ROUTE,
    onderweg: { type: "list", icon: "heart", items: [["Familie", "familie"], ["Vrienden", "vrienden"], ["Favoriete plekken", "favoriete"]] },
    vragen: { type: "list", icon: "search", items: [["Indeling", "indeling"], ["Prijzen", "prijzen"], ["Parkeren", "parkeren"]] },
    persoonlijk: { type: "chip", icon: "chat", text: "Persoonlijk gesprek" },
    cta: CTA,
  },
  2: {
    intro: { type: "title" },
    groen: { type: "chip", icon: "leaf", text: "Penthouse met groen rondom" },
    schaars: { type: "chip", icon: "star", text: "Zeldzaam in de eigen omgeving" },
    comfort: COMFORT,
    ligging: ROUTE,
    combinatie: { type: "list", icon: "check", items: [["Groen", "groen"], ["Goede ligging", "ligging"]] },
    indeling: { type: "list", icon: "search", items: [["Indeling", "ingedeeld"], ["Afwerking", "afgewerkt"]] },
    prijzen: { type: "chip", icon: "key", text: "Prijzen" },
    persoonlijk: { type: "chip", icon: "chat", text: "Persoonlijk, in alle rust" },
    cta: { ...CTA, text: "Plan een persoonlijke afspraak" },
  },
  3: {
    intro: { type: "title" },
    groen: { type: "chip", icon: "leaf", text: "Groen, in je eigen regio" },
    schaars: { type: "chip", icon: "search", text: "Dichtbij lastig te vinden" },
    blijven: { type: "chip", icon: "pin", text: "Blijf in je eigen regio" },
    dichtbij: { type: "list", icon: "heart", items: [["Familie", "familie"], ["Vrienden", "vrienden"], ["Vertrouwde plekken", "plekken"]] },
    comfort: COMFORT,
    ligging: ROUTE,
    moment: { type: "chip", icon: "calendar", text: "Het juiste moment?" },
    planning: { type: "list", icon: "calendar", items: [["Planning", "planning"], ["Beschikbaarheid", "beschikbaarheid"]] },
    cta: CTA,
  },
};

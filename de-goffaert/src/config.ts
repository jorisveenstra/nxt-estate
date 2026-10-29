// Welke AI-clips (Veo 3.1, staand 1080x1920) bij welke hook en scène horen. Alleen harde sneden tussen shots.
export const BODIES: Record<number, number> = { 1: 5, 2: 5, 3: 5 };

export const KICKER: Record<number, string> = {
  1: "Jouw eerste thuis",
  2: "Jouw volgende woonstap",
  3: "Comfortabel op één niveau",
};

// Hook: twee shots, geknipt halverwege de hook
export const HOOK_CLIPS: Record<number, Record<number, string[]>> = {
  1: {
    1: ["woonkamer-bank", "voorgevel-tuin"],
    2: ["straatgevel", "woonkamer-eethoek"],
    3: ["woonkamer-eethoek", "binnentuin"],
    4: ["isometrie", "straatgevel"],
    5: ["voorgevel-tuin", "woonkamer-tuindeuren"],
  },
  2: {
    1: ["slaapkamer", "woonkamer-balkon"],
    2: ["straatgevel", "binnentuin"],
    3: ["isometrie", "avond-gevel"],
    4: ["woonkamer-balkon", "slaapkamer"],
    5: ["binnentuin", "isometrie"],
  },
  3: {
    1: ["woonkamer-bank", "avond-gevel"],
    2: ["avond-gevel", "woonkamer-eethoek"],
    3: ["woonkamer-balkon", "straatgevel"],
    4: ["woonkamer-tuindeuren", "woonkamer-bank"],
    5: ["isometrie", "binnentuin"],
  },
};

// Woorden in de hook die als accent oplichten
export const HOOK_ACCENT: Record<number, Record<number, string[]>> = {
  1: { 1: ["huren", "eerste", "thuis"], 2: ["255.000", "studio", "vrij"], 3: ["spannend", "eerste"], 4: ["loopafstand", "binnenstad"], 5: ["krijgt", "eerste"] },
  2: { 1: ["aparte", "slaapkamer"], 2: ["buitenruimte", "parkeerplaats"], 3: ["parkeerplek", "binnenstad"], 4: ["één", "volgende"], 5: ["balkon,", "terras", "tuin,", "vier"] },
  3: { 1: ["overzichtelijker", "logés"], 2: ["verdieping,", "lift"], 3: ["slaapkamers,", "buitenruimte", "parkeerplaats"], 4: ["groter", "gemak"], 5: ["terras", "uitzicht"] },
};

// Scène -> shots (gelijk verdeeld over de scène)
export const SCENE_CLIPS: Record<number, Record<string, string[]>> = {
  1: {
    intro: ["voorgevel-tuin", "isometrie"],
    prijs: ["straatgevel"],
    incl: ["woonkamer-tuindeuren"],
    keuken: ["woonkamer-eethoek"],
    tuin: ["binnentuin"],
    spannend: ["woonkamer-bank"],
    kosten: ["woonkamer-balkon", "slaapkamer"],
    fin: ["avond-gevel", "voorgevel-tuin"],
    cta: ["avond-gevel"],
  },
  2: {
    intro: ["straatgevel", "voorgevel-tuin"],
    station: ["isometrie"],
    keuze: ["woonkamer-balkon"],
    buiten: ["binnentuin"],
    parkeren: ["straatgevel", "woonkamer-tuindeuren"],
    incl: ["slaapkamer", "woonkamer-eethoek"],
    prijs: ["avond-gevel", "voorgevel-tuin"],
    cta: ["avond-gevel"],
  },
  3: {
    intro: ["voorgevel-tuin", "woonkamer-bank"],
    slaap: ["slaapkamer", "woonkamer-balkon"],
    parkeren: ["straatgevel", "isometrie"],
    lift: ["woonkamer-tuindeuren", "woonkamer-eethoek"],
    buiten: ["binnentuin", "woonkamer-balkon"],
    incl: ["woonkamer-bank", "slaapkamer"],
    prijs: ["avond-gevel", "voorgevel-tuin"],
    cta: ["avond-gevel"],
  },
};

// Korte, feitelijke callouts (uit het script) per scène; max. enkele regels, footage blijft dominant
export type Card = { kicker?: string; big?: string; lines?: string[]; chips?: string[] };
export const SCENE_CARDS: Record<number, Record<string, Card>> = {
  1: {
    intro: { chips: ["Studio 45–57 m²", "Loopafstand binnenstad"] },
    prijs: { kicker: "Studio's", big: "Vanaf € 255.000", lines: ["vrij op naam"] },
    incl: { lines: ["Sanitair inbegrepen", "Eigen warmtepomp", "Geen leasekosten"] },
    keuken: { kicker: "8 sociale koopstudio's", lines: ["Keuken inbegrepen"] },
    tuin: { lines: ["Begane grond: eigen tuin"] },
    spannend: { big: "Je eerste aankoop?", lines: ["Begeleiding bij elke stap"] },
    kosten: { lines: ["Erfpacht en servicekosten", "Samen doorgerekend"] },
    fin: { lines: ["Financieringsverklaring binnen 5 werkdagen", "NHG mogelijk voor een deel"] },
  },
  2: {
    intro: { chips: ["Tweekamer 52–78 m²", "Loopafstand binnenstad"] },
    station: { chips: ["Station Alkmaar", "4 minuten fietsen"] },
    keuze: { lines: ["Jouw indeling", "Jouw verdieping"] },
    buiten: { lines: ["Eigen tuin, balkon of terras"] },
    parkeren: { lines: ["Parkeerplaats in de kelder inbegrepen", "Lift naar je verdieping"] },
    incl: { lines: ["Sanitair inbegrepen", "Eigen warmtepomp", "Geen leasekosten"] },
    prijs: { kicker: "Tweekamerappartementen", big: "Vanaf € 319.500", lines: ["vrij op naam", "+ erfpachtcanon en servicekosten"] },
  },
  3: {
    intro: { chips: ["Driekamer 70–100 m²", "Op één niveau"] },
    slaap: { lines: ["Twee slaapkamers", "Logés, hobby of werkplek"] },
    parkeren: { lines: ["Eigen plek in de parkeerkelder", "Parkeerplaats inbegrepen"] },
    lift: { lines: ["Met de lift naar je verdieping"] },
    buiten: { lines: ["Eigen tuin, balkon of terras", "Bovenin: terras met uitzicht"] },
    incl: { lines: ["Sanitair en tegelwerk", "Eigen warmtepomp", "Geen leasekosten"] },
    prijs: { kicker: "Driekamerappartementen", big: "Vanaf € 429.500", lines: ["vrij op naam"] },
  },
};

export const CTA_TEXT: Record<number, string> = {
  1: "Plan een afspraak met de makelaar",
  2: "Meer informatie en een afspraak met de makelaar",
  3: "Meer informatie of een afspraak met de makelaar",
};

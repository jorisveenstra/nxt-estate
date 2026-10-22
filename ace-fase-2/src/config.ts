// Per body: clips per hook en scène, accenten (iconen/kengetallen) en markeerwoorden in de hook.
// Clips zijn de AI-renders in ai-renders/clips (Veo 3.1, native 1080x1920) en staan als public/clips/<naam>.mp4.
// Alleen harde knipjes tussen clips; geen overgangen.
export type Item =
  | { k: "chip"; icon: string; text: string; w?: string }
  | { k: "stat"; big: string; small: string; w?: string };

export const BODIES: Record<number, number> = { 1: 5, 2: 5, 3: 5 };
export const TAAL: Record<number, "nl" | "en"> = { 1: "nl", 2: "nl", 3: "en" };

export const HOOK_CLIPS: Record<number, Record<number, string[]>> = {
  1: {
    1: ["balkons-gracht", "terras-eettafel"],
    2: ["gracht-zonsondergang", "wandelpad-bewoners"],
    3: ["toren-schemering", "waterpartij-toren"],
    4: ["padelbanen-toren", "park-gracht-gebouw"],
    5: ["padelbanen-toren", "cafe-plint-terras"],
  },
  2: {
    1: ["penthouse-woonkamer", "maisonnette-keuken-trap"],
    2: ["woonkamer-oranje-bank", "appartement-50m2"],
    3: ["wandelpad-bewoners", "park-gracht-gebouw"],
    4: ["woonkamer-oranje-bank", "terras-eettafel"],
    5: ["maisonnette-keuken-trap", "balkons-gracht"],
  },
  3: {
    1: ["wandelpad-bewoners", "gracht-zonsondergang"],
    2: ["appartement-50m2", "woonkamer-oranje-bank"],
    3: ["toren-schemering", "wandelpad-bewoners"],
    4: ["waterpartij-toren", "penthouse-woonkamer"],
    5: ["maisonnette-keuken-trap", "appartement-50m2"],
  },
};

export const HOOK_ACCENT: Record<number, Record<number, string[]>> = {
  1: {
    1: ["nieuwbouwwoning", "Amsterdam", "zuiden", "westen"],
    2: ["drukte", "parkeerstress"],
    3: ["Sloterplas", "gebouwd"],
    4: ["Tennis", "padel", "Sloterpark", "metro"],
    5: ["padel", "drankje", "café"],
  },
  2: {
    1: ["groot", "inleveren", "ruimte"],
    2: ["ruim", "nieuwbouwappartement", "Sloterplas"],
    3: ["onderhoud", "genieten", "Sloterpark"],
    4: ["comfortabeler", "oriënteren"],
    5: ["maisonnette", "penthouse", "170"],
  },
  3: {
    1: ["buying", "Amsterdam"],
    2: ["Dutch", "mortgage"],
    3: ["Zuidas", "new-build", "metro"],
    4: ["renting", "English"],
    5: ["complete", "English"],
  },
};

// Eerste clip van de eerste bodyscène: mag nooit de laatste clip van een hook zijn (harde knip, geen herhaling)
export const SCENE_CLIPS: Record<number, Record<string, string[]>> = {
  1: {
    intro: ["vogelvlucht"], woningen: ["waterpartij-toren", "penthouse-woonkamer"], licht: ["penthouse-woonkamer", "balkons-gracht"],
    sport: ["padelbanen-toren", "cafe-plint-terras"], rust: ["park-gracht-gebouw", "wandelpad-bewoners"], bereik: ["gracht-zonsondergang", "vogelvlucht"],
    parkeren: ["toren-schemering"], duurzaam: ["appartement-50m2", "woonkamer-oranje-bank"], cta: ["terras-eettafel"],
  },
  2: {
    intro: ["vogelvlucht"], ruimte: ["maisonnette-keuken-trap", "penthouse-woonkamer"], buiten: ["balkons-gracht", "terras-eettafel"],
    compleet: ["woonkamer-oranje-bank", "appartement-50m2"], buurt: ["wandelpad-bewoners", "cafe-plint-terras"], berging: ["toren-schemering"],
    planning: ["waterpartij-toren"], begeleiding: ["gracht-zonsondergang", "woonkamer-oranje-bank"], cta: ["terras-eettafel"],
  },
  3: {
    intro: ["vogelvlucht"], keuze: ["waterpartij-toren", "penthouse-woonkamer"], compleet: ["maisonnette-keuken-trap", "appartement-50m2"],
    metro: ["wandelpad-bewoners", "gracht-zonsondergang"], duurzaam: ["balkons-gracht", "woonkamer-oranje-bank"], begeleiding: ["cafe-plint-terras", "park-gracht-gebouw"],
    planning: ["toren-schemering"], cta: ["terras-eettafel"],
  },
};
export const POOL = ["vogelvlucht", "padelbanen-toren", "waterpartij-toren", "toren-schemering", "gracht-zonsondergang", "wandelpad-bewoners", "park-gracht-gebouw", "balkons-gracht", "cafe-plint-terras", "terras-eettafel", "penthouse-woonkamer", "woonkamer-oranje-bank", "maisonnette-keuken-trap", "appartement-50m2"];

const LOC: Item = { k: "chip", icon: "pin", text: "Sloterplas · Amsterdam Nieuw-West", w: "Sloterplas" };
const ZUID: Item = { k: "chip", icon: "sun", text: "Buitenruimte op zuid of west", w: "buitenruimte" };
const GASLOOS: Item = { k: "chip", icon: "leaf", text: "Gasloos", w: "gasloos" };
const AL: Item = { k: "stat", big: "A+", small: "energielabel, minimaal", w: "A+" };

export const SCENE_ITEMS: Record<number, Record<string, Item[]>> = {
  1: {
    intro: [LOC],
    woningen: [{ k: "stat", big: "50–170 m²", small: "appartementen · maisonnettes · penthouses", w: "circa" }, { k: "chip", icon: "building", text: "Luxe afwerking", w: "luxe" }],
    licht: [{ k: "chip", icon: "expand", text: "Grote ramen, volop licht", w: "ramen" }, ZUID],
    sport: [{ k: "stat", big: "Tennis & padel", small: "racketsportcentrum in het hart van het plan", w: "racketsportcentrum" }, { k: "chip", icon: "cup", text: "Sfeervol café", w: "café" }],
    rust: [{ k: "chip", icon: "leaf", text: "Autoluw binnengebied", w: "autoluw" }, { k: "chip", icon: "tree", text: "Sloterpark naast de deur", w: "Sloterpark" }],
    bereik: [{ k: "chip", icon: "metro", text: "Metro op loopafstand", w: "metro" }, { k: "stat", big: "15 min", small: "fietsen naar centrum én Zuidas", w: "vijftien" }],
    parkeren: [{ k: "stat", big: "5", small: "deelauto's", w: "vijf" }, { k: "chip", icon: "car", text: "Abonnement parkeergarage", w: "abonnement" }],
    duurzaam: [GASLOOS, { k: "chip", icon: "heat", text: "Vloerverwarming & -koeling", w: "vloerverwarming" }, AL],
    cta: [{ k: "chip", icon: "home", text: "Nieuwbouw aan de Sloterplas" }],
  },
  2: {
    intro: [LOC],
    ruimte: [{ k: "stat", big: "170 m²", small: "maisonnettes & penthouses", w: "170" }, { k: "chip", icon: "home", text: "Naast appartementen", w: "naast" }],
    buiten: [{ k: "chip", icon: "sun", text: "Royaal balkon of terras", w: "royaal" }, { k: "chip", icon: "expand", text: "Zuid of west", w: "zuiden" }],
    compleet: [{ k: "chip", icon: "key", text: "Compleet: keuken & badkamer", w: "compleet" }, GASLOOS, { k: "chip", icon: "check", text: "Minder onderhoud", w: "minder" }],
    buurt: [{ k: "chip", icon: "bag", text: "Winkels, zorg & sportclubs", w: "winkels" }, { k: "chip", icon: "tree", text: "Sloterpark naast uw deur", w: "Sloterpark" }],
    berging: [{ k: "chip", icon: "box", text: "Eigen berging", w: "berging" }, { k: "chip", icon: "car", text: "Abonnement parkeergarage", w: "abonnement" }],
    planning: [{ k: "stat", big: "Eind 2026", small: "verwachte start bouw", w: "eind" }, { k: "stat", big: "Nazomer 2028", small: "verwachte oplevering", w: "nazomer" }],
    begeleiding: [{ k: "chip", icon: "chat", text: "Persoonlijke begeleiding", w: "persoonlijke" }, { k: "chip", icon: "check", text: "Financieringscoach", w: "financieringscoach" }],
    cta: [{ k: "chip", icon: "calendar", text: "Plan een afspraak" }],
  },
  3: {
    intro: [{ k: "chip", icon: "pin", text: "Sloterplas · Amsterdam Nieuw-West", w: "Sloterplas" }],
    keuze: [{ k: "stat", big: "50–170 m²", small: "apartments · maisonettes · penthouses", w: "around" }],
    compleet: [{ k: "chip", icon: "key", text: "Kitchen & bathroom included", w: "kitchen" }, { k: "chip", icon: "check", text: "Toilet included", w: "toilet" }],
    metro: [{ k: "chip", icon: "metro", text: "Metro Jan van Galenstraat", w: "Jan" }, { k: "stat", big: "15 min", small: "cycling to centre & Zuidas", w: "fifteen" }],
    duurzaam: [{ k: "chip", icon: "leaf", text: "Gas-free", w: "gas-free" }, { k: "chip", icon: "heat", text: "Underfloor heating & cooling", w: "underfloor" }, { k: "stat", big: "A+", small: "energy label, at least", w: "A+" }],
    begeleiding: [{ k: "chip", icon: "chat", text: "English-speaking agents", w: "English-speaking" }, { k: "chip", icon: "key", text: "Mortgage options for expats", w: "mortgage" }],
    planning: [{ k: "stat", big: "End 2026", small: "expected construction start", w: "end" }, { k: "stat", big: "Late summer 2028", small: "planned completion", w: "late" }],
    cta: [{ k: "chip", icon: "calendar", text: "Plan a personal meeting" }],
  },
};

export const CTA_TEKST = {
  nl: { kop: "Alle informatie", knop: "Klik op de knop hieronder" },
  en: { kop: "All information", knop: "Click the button below" },
};
export const SITE = "acefase2-amsterdam.afspraakbij.info";

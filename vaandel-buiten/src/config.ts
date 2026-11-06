// Per body: welke clip bij welke scène hoort ([clip, woord waarop naar deze clip wordt geknipt of null]) en welke
// feiten als korte animatie in beeld komen. Harde cuts tussen shots, geen overgangen.
export type ClipList = [string, string | null][];
export type Callout = { at: string; icon: Icon; title: string; sub?: string };
export type Icon = "house" | "tree" | "smile" | "car" | "euro" | "calendar" | "check" | "area" | "bath" | "key" | "heart";

export const BODIES = { 1: 5, 2: 5 } as Record<number, number>;

export const BODY_CLIPS: Record<number, Record<string, ClipList>> = {
  1: {
    intro: [["aerial", null]],
    ruimte: [["park_path", null]],
    tuin: [["veg_garden", null]],
    kinderen: [["pond_woman", null]],
    spelen: [],
    parkeren: [["wood_row", null]],
    prijs: [["dark_house", null]],
    bouw: [["row_path", null]],
    cta: [["bike_lane", null], ["blossom_path", "Klik"]],
  },
  2: {
    intro: [["aerial", null]],
    gelijkvloers: [["dark_house", null]],
    trap: [["gables_flowers", null]],
    ruimte: [["park_path", null]],
    groen: [["veg_garden", null]],
    prijs: [["wood_row", null]],
    bouw: [["row_path", null]],
    cta: [["cyclist_park", null], ["blossom_path", "Klik"]],
  },
};

export const HOOK_CLIPS: Record<number, Record<number, string>> = {
  1: { 1: "gables_flowers", 2: "pond_woman", 3: "dark_house", 4: "cyclist_park", 5: "blossom_path" },
  2: { 1: "park_path", 2: "dark_house", 3: "wood_row", 4: "gables_flowers", 5: "bike_lane" },
};

// Woorden (zonder leestekens, kleine letters) die in de hook-kop extra worden benadrukt
export const HOOK_ACCENT: Record<number, Record<number, string[]>> = {
  1: { 1: ["rijwoning", "klein"], 2: ["12", "15", "zuiden", "buiten"], 3: ["ruime", "diepe", "tuin"], 4: ["meer", "ruimte", "alkmaar"], 5: ["gezinswoningen"] },
  2: { 1: ["gelijkvloers"], 2: ["badkamer", "beneden", "ruimte"], 3: ["gelijkvloers", "kleiner"], 4: ["levensloopbestendige"], 5: ["comfortabele", "groen", "hofje"] },
};

export const CALLOUTS: Record<number, Record<string, Callout[]>> = {
  1: {
    intro: [{ at: "kleinschalig,", icon: "tree", title: "Kleinschalig & groen", sub: "Noord-Hollandse boerderijstijl" }],
    ruimte: [{ at: "140", icon: "area", title: "140 – 203 m²", sub: "woonoppervlak" }],
    tuin: [{ at: "tuin", icon: "tree", title: "Tuin van 12 – 15 m diep", sub: "De Hofmeester II · deels op het zuiden" }],
    spelen: [{ at: "kindvriendelijke", icon: "smile", title: "Kindvriendelijke wijk", sub: "natuurspeelplekken · overdekte buurtschuur" }],
    parkeren: [{ at: "twee", icon: "car", title: "2 auto's op eigen terrein", sub: "De Hofmeester II" }],
    prijs: [
      { at: "zeshonderdvijfendertigduizend", icon: "euro", title: "Vanaf € 635.000 v.o.n.", sub: "vrij op naam" },
      { at: "geen", icon: "check", title: "Geen overdrachtsbelasting" },
    ],
    bouw: [{ at: "tweede", icon: "calendar", title: "Start bouw: Q2 2027", sub: "naar verwachting" }],
  },
  2: {
    intro: [{ at: "kleinschalig,", icon: "tree", title: "Kleinschalig & groen", sub: "hofjes · boerderijarchitectuur" }],
    gelijkvloers: [
      { at: "gelijkvloers", icon: "house", title: "Gelijkvloers wonen", sub: "De Hofmeester III · De Rentmeester XL" },
      { at: "badkamer", icon: "bath", title: "Kamer + badkamer beneden", sub: "op de begane grond" },
    ],
    trap: [{ at: "comfortabel,", icon: "check", title: "Levensloopbestendig", sub: "comfortabel wonen" }],
    ruimte: [{ at: "140", icon: "area", title: "140 – 203 m²", sub: "geen ruimte inleveren" }],
    groen: [{ at: "moestuinen", icon: "tree", title: "Gezamenlijke moestuinen", sub: "overdekte buurtschuur" }],
    prijs: [
      { at: "zeshonderdvijfendertigduizend", icon: "euro", title: "Vanaf € 635.000 v.o.n.", sub: "vrij op naam" },
      { at: "geen", icon: "check", title: "Geen overdrachtsbelasting" },
    ],
    bouw: [{ at: "tweede", icon: "calendar", title: "Start bouw: Q2 2027", sub: "naar verwachting" }],
  },
};

export const CTA_TEXT: Record<number, { kop: string; datum: string; knop: string }> = {
  1: { kop: "Online inschrijving", datum: "di 17 november · 17:00 uur", knop: "Schrijf je in" },
  2: { kop: "Online inschrijving", datum: "vanaf di 17 november · 17:00 uur", knop: "Schrijf u in" },
};

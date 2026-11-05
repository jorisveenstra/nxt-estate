// Per body: welke clip bij welke scène hoort ([clip, woord waarop naar deze clip wordt geknipt of null]) en welke
// feiten als korte animatie in beeld komen. Harde cuts tussen shots, geen overgangen.
export type ClipList = [string, string | null][];
export type Callout = { at: string; icon: Icon; title: string; sub?: string };
export type Icon = "house" | "tree" | "smile" | "car" | "euro" | "calendar" | "check" | "area" | "bath" | "key" | "heart";

export const BODIES = { 1: 5, 2: 5 } as Record<number, number>;

export const BODY_CLIPS: Record<number, Record<string, ClipList>> = {
  1: {
    intro: [["house_water", null]],
    ruimte: [["gable_cars", null]],
    tuin: [["garden_water", null]],
    kinderen: [["kids_water", null]],
    spelen: [],
    parkeren: [["street_trees", null]],
    prijs: [["gable_street", null]],
    bouw: [["corner_bike", null]],
    cta: [["interior_kids", null], ["interior_garden", "Klik"]],
  },
  2: {
    intro: [["house_water", null]],
    gelijkvloers: [["interior_garden", null]],
    trap: [["interior_living", null]],
    ruimte: [["gable_cars", null]],
    groen: [["garden_water", null]],
    prijs: [["gable_street", null]],
    bouw: [["street_trees", null]],
    cta: [["corner_bike", null], ["interior_dining", "Klik"]],
  },
};

export const HOOK_CLIPS: Record<number, Record<number, string>> = {
  1: { 1: "interior_kitchen", 2: "interior_garden", 3: "corner_bike", 4: "street_trees", 5: "gable_street" },
  2: { 1: "gable_cars", 2: "interior_dining", 3: "interior_kitchen", 4: "gable_street", 5: "kids_water" },
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

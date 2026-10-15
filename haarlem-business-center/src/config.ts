import type { IconName } from "./icons";

// Clip-lijst per scène: [clip, woord waarop naar deze clip wordt overgegaan (null = begin), n-de voorkomen]
export type ClipList = [string, string | null, number?][];
export type Key = string | [string, number];

// Clipnamen = bestandsnamen in public/clips (AI-beeld-naar-video van de aangeleverde foto's)
const C = {
  spaarne: "hbc-spaarne-kant.4",
  waarderweg: "hbc-waarderweg",
  entree: "hbc-entree-close-up",
  punt: "hbc-punt-orgineel",
  dek: "onder-het-dek",
  puntclose: "punt-closeup",
  glas: "units-met-glazen-gevel-gecombineerd",
  overhead: "units-standaard-met-glazen-overhead-deur",
  terras: "g33",
  hal: "h26.1",
  units: "h26.10",
  fiets: "h26.2",
  binnen: "h7",
  lunch: "j19",
  gevel: "j38",
  gevel2: "j38.3",
};

// Welke bodies/hooks worden gerenderd (max 10 video's per opdracht)
export const VIDEOS: { body: number; hook: number }[] = [
  { body: 1, hook: 1 }, { body: 1, hook: 2 }, { body: 1, hook: 3 },
  { body: 2, hook: 1 }, { body: 2, hook: 3 }, { body: 2, hook: 4 },
  { body: 3, hook: 1 }, { body: 3, hook: 2 }, { body: 3, hook: 3 },
];

export const HOOK_CLIPS: Record<string, ClipList> = {
  b1h1: [[C.lunch, null], [C.terras, "team"]],
  b1h2: [[C.gevel, null], [C.binnen, "tussen"]],
  b1h3: [[C.overhead, null], [C.entree, "klanten"]],
  b2h1: [[C.waarderweg, null], [C.units, "parkeren"]],
  b2h3: [[C.overhead, null], [C.hal, "kantoor"]],
  b2h4: [[C.units, null], [C.glas, "zoek"]],
  b3h1: [[C.entree, null], [C.gevel2, "juiste"]],
  b3h2: [[C.glas, null], [C.gevel, "gevel"]],
  b3h3: [[C.gevel, null], [C.dek, "net"]],
};

export const HOOK_ACCENT: Record<string, string[]> = {
  b1h1: ["kantoor", "uitzicht"], b1h2: ["karakter"], b1h3: ["trots"],
  b2h1: ["parkeren", "laadpunten"], b2h3: ["één", "dak"], b2h4: ["meer", "ruimte"],
  b3h1: ["eerste", "indruk"], b3h2: ["daglicht"], b3h3: ["vakmanschap"],
};

export const SCENE_CLIPS: Record<string, ClipList> = {
  "1:intro": [[C.spaarne, null], [C.punt, "Spaarne"]],
  "1:bedrijven": [[C.binnen, null], [C.glas, "vakbedrijf"]],
  "1:units": [[C.overhead, null], [C.glas, "glazen"], [C.gevel, "kantoorunit"], [C.hal, "hallen."]],
  "1:lunchroom": [[C.terras, null], [C.lunch, "voor"]],
  "1:netwerk": [[C.fiets, null]],
  "1:ligging": [[C.waarderweg, null], [C.dek, "parkeert"]],
  "1:oplevering": [[C.punt, null]],
  "1:cta": [[C.spaarne, null]],
  "2:huur": [[C.waarderweg, null], [C.spaarne, "kilometer"]],
  "2:twee": [[C.overhead, null], [C.glas, "beneden"]],
  "2:wensen": [[C.gevel, null], [C.hal, "hallen"]],
  "2:parkeren": [[C.units, null], [C.entree, "24/7"]],
  "2:energie": [[C.fiets, null], [C.gevel2, "zodat"]],
  "2:bereik": [[C.binnen, null], [C.punt, "Schiphol"]],
  "2:oplevering": [[C.punt, null]],
  "2:cta": [[C.spaarne, null]],
  "3:intro": [[C.punt, null], [C.spaarne, "direct"]],
  "3:karakter": [[C.gevel, null], [C.entree, "statige"]],
  "3:indruk": [[C.gevel2, null]],
  "3:zichtbaar": [[C.glas, null], [C.waarderweg, "hallen"]],
  "3:uitzicht": [[C.terras, null]],
  "3:label": [[C.gevel, null], [C.fiets, "duurzaam"]],
  "3:oplevering": [[C.punt, null]],
  "3:cta": [[C.spaarne, null]],
};

export type Tile = { icon: IconName; label: string; sub?: string; at: Key };
export type Stat = { value: string; count?: number; label: string; at: Key };
export type Graphic = {
  kicker?: string;
  title?: string;
  accent?: string[]; // woorden in de titel die brons gemarkeerd worden
  stats?: Stat[];
  tiles?: Tile[];
  chips?: { label: string; at: Key }[];
  titleAt?: Key;
};

// "Dikke graphics" per zin
export const GRAPHICS: Record<string, Graphic> = {
  "1:intro": { kicker: "Nieuw bedrijfsgebouw", title: "Direct aan Het Spaarne", accent: ["Spaarne"], tiles: [{ icon: "pin", label: "Haarlem", sub: "Aan het water", at: "direct" }] },
  "1:bedrijven": {
    kicker: "Ruimte voor",
    stats: [{ value: "126", count: 126, label: "bedrijven", at: "126" }],
    chips: [
      { label: "Vakbedrijf", at: "vakbedrijf" }, { label: "Kantoor", at: "kantoor" },
      { label: "Atelier", at: "atelier" }, { label: "Groothandel", at: "groothandel" },
    ],
  },
  "1:units": {
    kicker: "Jouw keuze",
    tiles: [
      { icon: "door", label: "Overheaddeur", sub: "Unit", at: "overheaddeur" },
      { icon: "glass", label: "Glazen gevel", sub: "Unit", at: "glazen" },
      { icon: "office", label: "Kantoorunit", sub: "Bovenste verdieping", at: "kantoorunit" },
      { icon: "hall", label: "3 grote hallen", sub: "Bedrijfshal", at: "hallen" },
    ],
  },
  "1:lunchroom": {
    kicker: "4e etage",
    title: "Lunchroom met dakterras",
    accent: ["dakterras"],
    tiles: [{ icon: "view", label: "Uitzicht over Het Spaarne", at: "uitzicht" }],
    chips: [{ label: "Lunch", at: ["lunch", 1] }, { label: "Klantafspraak", at: "klantafspraak" }, { label: "Borrel", at: "borrel" }],
  },
  "1:netwerk": {
    kicker: "Onder ondernemers",
    title: "Elke dag nieuwe contacten",
    accent: ["contacten"],
    tiles: [
      { icon: "people", label: "Ondernemers ontmoeten", at: "ondernemers" },
      { icon: "chat", label: "Ervaringen uitwisselen", at: "ervaringen" },
    ],
  },
  "1:ligging": {
    stats: [{ value: "±1 km", label: "naar Haarlem Centrum", at: "kilometer" }],
    tiles: [{ icon: "car", label: "Parkeren op eigen terrein", at: "parkeert" }],
  },
  "1:oplevering": { kicker: "Oplevering", title: "November 2026", accent: ["2026"], tiles: [{ icon: "calendar", label: "Gepland", at: "november" }] },

  "2:huur": {
    kicker: "Nieuwe bedrijfsruimte",
    stats: [{ value: "±1 km", label: "van Haarlem Centrum", at: "kilometer" }],
    tiles: [{ icon: "key", label: "Huur een nieuwe unit", at: "bedrijfsruimte" }],
  },
  "2:twee": {
    kicker: "Overheaddeur of glazen gevel",
    stats: [{ value: "±120 m²", label: "over twee verdiepingen", at: "120" }],
    tiles: [
      { icon: "truck", label: "Beneden", sub: "Werkplaats · opslag · showroom", at: "beneden" },
      { icon: "office", label: "Boven", sub: "Kantoor", at: "boven" },
    ],
  },
  "2:wensen": {
    kicker: "Andere wensen?",
    tiles: [
      { icon: "office", label: "Kantoorunits", sub: "Bovenste verdieping", at: "kantoorunits" },
      { icon: "hall", label: "3 grote hallen", sub: "Zwaar belastbare vloeren", at: "hallen" },
    ],
  },
  "2:parkeren": {
    kicker: "Op het terrein",
    stats: [
      { value: "148", count: 148, label: "parkeerplaatsen", at: "148" },
      { value: "16", count: 16, label: "met laadpunt", at: "16" },
      { value: "24/7", label: "cameraregistratie", at: "24/7" },
    ],
  },
  "2:energie": {
    kicker: "Standaard in elke bedrijfsunit",
    tiles: [
      { icon: "heat", label: "Warmtepomp", at: "warmtepomp" },
      { icon: "window", label: "HR++ beglazing", at: "HR++" },
      { icon: "bolt", label: "Beheersbare energielasten", at: "energielasten" },
    ],
  },
  "2:bereik": {
    kicker: "Goed bereikbaar",
    tiles: [
      { icon: "road", label: "A9", sub: "Dichtbij", at: "A9" },
      { icon: "road", label: "Ring A10", sub: "Dichtbij", at: "A10" },
      { icon: "plane", label: "Schiphol", sub: "±15 kilometer", at: "Schiphol" },
    ],
  },
  "2:oplevering": {
    kicker: "Verhuur gestart",
    title: "Oplevering november 2026",
    accent: ["2026"],
    tiles: [{ icon: "check", label: "De verhuur is gestart", at: "verhuur" }, { icon: "calendar", label: "Oplevering: november 2026", at: "oplevering" }],
  },

  "3:intro": { kicker: "Nieuw bedrijfsgebouw", title: "Industriële stijl, direct aan Het Spaarne", accent: ["Industriële"], tiles: [{ icon: "pin", label: "Haarlem", sub: "Aan het water", at: "direct" }] },
  "3:karakter": {
    kicker: "Eigen karakter",
    tiles: [
      { icon: "window", label: "Veel raampartijen", at: "raampartijen," },
      { icon: "sun", label: "Veel licht", at: "licht" },
      { icon: "lift", label: "Statige entree met lift", at: "entree" },
    ],
  },
  "3:indruk": {
    kicker: "Meteen een sterke eerste indruk",
    title: "Bij elke bezoeker",
    accent: ["bezoeker"],
    chips: [{ label: "Klant", at: "klant," }, { label: "Leverancier", at: "leverancier" }, { label: "Nieuwe medewerker", at: "medewerker" }],
  },
  "3:zichtbaar": {
    kicker: "Zichtbaar voor iedereen",
    tiles: [
      { icon: "glass", label: "Glazen gevel", sub: "Bezoekers zien direct waar je bedrijf voor staat", at: "glazen" },
      { icon: "road", label: "Hallen aan de Waarderweg en Kuipersweg", sub: "Goed zichtbaar vanaf de weg", at: "Waarderweg" },
    ],
  },
  "3:uitzicht": {
    kicker: "Bovenste verdieping",
    title: "Uitzicht over Het Spaarne en Haarlem",
    accent: ["uitzicht"],
    tiles: [{ icon: "office", label: "Kantoorunits", at: "kantoorunits" }],
  },
  "3:label": {
    kicker: "Alle unittypes",
    stats: [{ value: "A++", label: "minimaal energielabel", at: "minimaal" }],
    tiles: [{ icon: "leaf", label: "Duurzaam ondernemen", at: "duurzaam" }],
  },
  "3:oplevering": {
    kicker: "Verhuur gestart",
    title: "Oplevering november 2026",
    accent: ["2026"],
    tiles: [{ icon: "check", label: "De verhuur is gestart", at: "verhuur" }, { icon: "calendar", label: "Oplevering: november 2026", at: "oplevering" }],
  },
};

export const CTA_TEXT: Record<number, { kop: string; sub: string }> = {
  1: { kop: "Welke unit past bij jouw bedrijf?", sub: "Schrijf je in en ontvang alle informatie over de beschikbare units." },
  2: { kop: "De eerste units zijn al verhuurd", sub: "Plan je afspraak met onze makelaar in." },
  3: { kop: "Zo presenteert jouw bedrijf zich hier", sub: "Vraag de brochure aan met alle unittypes en plattegronden." },
};

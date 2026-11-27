// Welke clip bij welke hook/scène, plus de korte geanimeerde accenten per scène.
// Clips staan in public/clips (native 1080x1920, uit de Frame.io-bronnenbibliotheek; zie scripts/bronnen.json).
// wa* = nieuwe WhatsApp-impressies (19-11-2026) die met Veo 3.1 tot beweging zijn gebracht.

export type IconName = "pin" | "ruler" | "people" | "car" | "euro" | "calendar" | "leaf" | "lift" | "sun" | "layers" | "route" | "plug" | "coffee" | "star" | "grid";

export type Accent = {
  icon: IconName;
  label: string; // kleine bovenregel
  value: string; // grote waarde
};

export const AUDIENCE: Record<number, string> = {
  1: "Voor creatieve bureaus",
  2: "Voor showrooms & interieur",
  3: "Voor dienstverleners & data",
};

export const HOOK_CLIPS: Record<number, Record<number, string>> = {
  1: { 1: "wa2", 2: "wa10", 3: "wa1", 4: "wa3", 5: "g33" },
  2: { 1: "units-glasgevel", 2: "wa10", 3: "wa2", 4: "units-overhead", 5: "h26-10" },
  3: { 1: "wa5", 2: "wa7", 3: "wa8", 4: "wa3", 5: "wa2" },
};

export const SCENE_CLIPS: Record<number, Record<string, string[]>> = {
  1: {
    ligging: ["spaarne-kant", "wa3"],
    plafond: ["wa8", "wa1"],
    ontvangst: ["j19", "g33"],
    bereik: ["waarderweg", "punt-origineel"],
    parkeren: ["h26-1", "h7"],
    prijs: ["wa7"],
    oplevering: ["wa5", "j38"],
    cta: ["entree", "wa3"],
  },
  2: {
    unit: ["units-glasgevel", "units-overhead"],
    daglicht: ["wa8", "wa10"],
    indeling: ["wa2", "wa5"],
    uitstraling: ["j38", "punt-closeup"],
    lift: ["onder-dek", "h26-2"],
    parkeren: ["h26-1", "h7"],
    oplevering: ["wa7", "spaarne-kant"],
    cta: ["entree", "wa3"],
  },
  3: {
    ligging: ["wa3", "punt-origineel"],
    metrage: ["wa7", "wa8"],
    gasloos: ["j38-3", "j38"],
    bereik: ["waarderweg", "spaarne-kant"],
    parkeren: ["h26-1", "h26-2"],
    lunchroom: ["j19", "wa1"],
    oplevering: ["wa10", "punt-closeup"],
    cta: ["entree", "wa3"],
  },
};

// Accenten: alleen feiten uit het script / de projectinformatie.
export const ACCENTS: Record<number, Record<string, Accent[]>> = {
  1: {
    ligging: [{ icon: "layers", label: "Kantoorunit", value: "4e verdieping" }, { icon: "pin", label: "Direct aan", value: "Het Spaarne" }],
    plafond: [{ icon: "ruler", label: "Plafondhoogte", value: "± 3 meter" }, { icon: "sun", label: "Licht & ruimtelijk", value: "Uitzicht op het water" }],
    ontvangst: [{ icon: "coffee", label: "Ontvangen in de", value: "Lunchroom" }, { icon: "star", label: "Of op het", value: "Dakterras" }],
    bereik: [{ icon: "pin", label: "Centrum Haarlem", value: "± 1 km" }, { icon: "route", label: "Vanuit Amsterdam", value: "A9 & A10" }],
    parkeren: [{ icon: "car", label: "Parkeren", value: "Gratis" }],
    prijs: [{ icon: "euro", label: "Huren vanaf", value: "€ 1.895" }],
    oplevering: [{ icon: "calendar", label: "Al opgeleverd", value: "Direct intrekken" }],
    cta: [],
  },
  2: {
    unit: [{ icon: "grid", label: "Unit met glazen gevel", value: "± 120 m²" }, { icon: "layers", label: "Verdeeld over", value: "2 verdiepingen" }],
    daglicht: [{ icon: "sun", label: "Hoge ramen", value: "Veel daglicht" }],
    indeling: [{ icon: "layers", label: "Beneden", value: "Showroom" }, { icon: "layers", label: "Boven", value: "Studio of opslag" }],
    uitstraling: [{ icon: "star", label: "Uitstraling", value: "Industrieel & representatief" }],
    lift: [{ icon: "lift", label: "Naar het dekniveau", value: "Goederenlift" }],
    parkeren: [{ icon: "car", label: "Parkeren op locatie", value: "148 plaatsen" }],
    oplevering: [{ icon: "calendar", label: "Al opgeleverd", value: "Direct intrekken" }],
    cta: [],
  },
  3: {
    ligging: [{ icon: "layers", label: "Kantoorunit", value: "4e verdieping" }, { icon: "pin", label: "Nieuw gebouw aan", value: "Het Spaarne" }],
    metrage: [{ icon: "grid", label: "Samen te stellen", value: "Diverse metrages" }, { icon: "people", label: "Past bij", value: "Jouw team" }],
    gasloos: [{ icon: "leaf", label: "Duurzaam", value: "Gasloos" }, { icon: "sun", label: "Warmtepompen", value: "HR++-glas" }],
    bereik: [{ icon: "route", label: "Schiphol", value: "± 15 km" }, { icon: "route", label: "Amsterdam Centrum", value: "± 20 km" }],
    parkeren: [{ icon: "car", label: "Parkeren op locatie", value: "148 plaatsen" }, { icon: "plug", label: "Met laadpunt", value: "16 plaatsen" }],
    lunchroom: [{ icon: "coffee", label: "Netwerken in de", value: "Lunchroom" }],
    oplevering: [{ icon: "calendar", label: "Al opgeleverd", value: "Direct intrekken" }],
    cta: [],
  },
};

// Accentwoorden in de ondertitels (krijgen goud)
export const HIGHLIGHT = /^(spaarne|haarlem|gratis|1\.895|120|148|opgeleverd|intrekken|gasloos|daglicht|dakterras|lunchroom|showroom|schiphol|amsterdam|water|vierde|drie|zestien|kilometer)$/i;

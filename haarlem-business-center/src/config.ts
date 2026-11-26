// Welke bibliotheekclip (hergebruikt uit de Frame.io-bronnenbibliotheek, native 1080x1920) bij welke hook en scène hoort.
// Een clip-lijst is [clip, woord waarop naar deze clip wordt geknipt]; de eerste heeft null. Alleen harde knips.
export type ClipList = [string, string | null][];

export const BODIES: Record<number, number> = { 1: 5 };

export const HOOK_CLIPS: Record<number, Record<number, ClipList>> = {
  1: {
    1: [["restaurant", null], ["units-glas", "zakelijke"]],
    2: [["units-deur", null], ["gevel-beige", "gasten"]],
    3: [["water-spaarne", null]],
    4: [["water-punt", null], ["restaurant", "mooiste"]],
    5: [["terras", null], ["water-spaarne", "dakterras?"]],
  },
};

// Hookwoorden die in beeld oplichten (goud)
export const HOOK_ACCENT: Record<number, Record<number, string[]>> = {
  1: {
    1: ["tweede", "zakelijke"],
    2: ["groeien", "elke", "werkdag"],
    3: ["uitzicht", "Spaarne?"],
    4: ["dé", "horecaruimte"],
    5: ["water", "dakterras?"],
  },
};

export const SCENE_CLIPS: Record<string, ClipList> = {
  plek: [["water-closeup", null], ["water-spaarne", "aan"]],
  terras: [["restaurant", null], ["terras", "dakterras"]],
  gasten: [["straat", null], ["units-deur", "ateliers,"], ["gevel-baksteen", "showrooms,"]],
  ontmoeten: [["entree", null], ["terras", "relaties"], ["restaurant", "zakelijke"]],
  klanten: [["lucht", null], ["gevel-baksteen2", "vaste"]],
  verhuur: [["boog", null], ["units-glas", "eerste"]],
  cta: [["water-punt", null], ["entree", "plan"]],
};

// Korte accenten (callouts) per scène: tekst verschijnt op het woord
export const SCENE_CALLOUTS: Record<string, { word: string; text: string; icon: string }[]> = {
  plek: [{ word: "mooiste", text: "Mooiste plek van het gebouw", icon: "pin" }, { word: "Spaarne.", text: "Aan Het Spaarne", icon: "water" }],
  terras: [{ word: "koffie,", text: "Koffie · Lunch · Borrel", icon: "cup" }, { word: "dakterras", text: "Dakterras met waterzicht", icon: "sun" }],
  gasten: [{ word: "kantoren,", text: "Kantoren & ateliers", icon: "building" }, { word: "showrooms,", text: "Showrooms & werkplaatsen", icon: "building" }, { word: "één", text: "Allemaal onder één dak", icon: "roof" }],
  ontmoeten: [{ word: "ontmoeten,", text: "Ontmoeten & ontvangen", icon: "people" }, { word: "bijeenkomsten", text: "Klein of groot", icon: "people" }],
  klanten: [{ word: "vaste", text: "Vaste gasten om je heen", icon: "heart" }],
  verhuur: [{ word: "verhuur", text: "Verhuur loopt al", icon: "key" }, { word: "eerste", text: "Eerste units opgeleverd", icon: "check" }],
};

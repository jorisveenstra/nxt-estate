// Per doelgroep (body): welke renderclips bij welke hook en scène horen, en welke hookwoorden rood gemarkeerd worden.
// Een clip-lijst is [clip, woord waarop naar deze clip wordt geknipt]; de eerste heeft null.
type ClipList = [string, string | null][];

export const BODIES: Record<number, number> = { 1: 5, 2: 5, 3: 5 }; // aantal hooks per doelgroep

export const HOOK_CLIPS: Record<number, Record<number, ClipList>> = {
  1: {
    1: [["luchtfoto-terrein", null], ["gevel-naam", "investeren"]],
    2: [["hoek-gevel", null], ["gevel-avond", "nooit"]],
    3: [["hal-trap", null], ["opslag", "opslag"], ["kantoor", "kantoor"]],
    4: [["gevel-front", null], ["gevel-auto-in", "eigen"]],
    5: [["hoek-firma", null], ["entree-3", "niet"]],
  },
  2: {
    1: [["opslag", null], ["gevel-auto-in", "investeren"]],
    2: [["hal-lang", null], ["opslag", "materiaal"]],
    3: [["hoek-gevel", null], ["hal-trap", "eigen"], ["kantoor", "kantoor"]],
    4: [["gevel-auto-in", null], ["achter-auto-uit", "achterkant"]],
    5: [["snelweg-gevel", null], ["snelweg-avond", "dagelijks"]],
  },
  3: {
    1: [["dorp-kerk", null], ["gevel-naam", "investeren"]],
    2: [["luchtfoto-terrein", null], ["hoek-gevel", "spreiden"]],
    3: [["luchtfoto-a27", null], ["snelweg-gevel", "zichtlocatie"]],
    4: [["terras-firma", null], ["kantoor", "huurders"]],
    5: [["snelweg-gevel", null], ["luchtfoto-a27", "100000"]],
  },
};

export const HOOK_ACCENT: Record<number, Record<number, string[]>> = {
  1: {
    1: ["eigen", "pand?"],
    2: ["nooit"],
    3: ["onder", "één", "dak"],
    4: ["eigen", "pand"],
    5: ["vastzitten"],
  },
  2: {
    1: ["eigen", "pand?"],
    2: ["te", "klein"],
    3: ["volgende", "stap"],
    4: ["voorkant", "achterkant"],
    5: ["duizenden"],
  },
  3: {
    1: ["bedrijfspand?"],
    2: ["spreiden"],
    3: ["zichtlocatie"],
    4: ["huurders"],
    5: ["100.000"],
  },
};

const SCENE_CLIPS: Record<string, ClipList> = {
  intro: [["luchtfoto-units", null], ["dorp-kerk", "maartensdijk"], ["luchtfoto-a27", "centrale"]],
  laatste: [["luchtfoto-units", null], ["hal-lang", "300"], ["opslag", "opslag"], ["kantoor", "kantoor"]],
  indeling: [["hal-kantoor", null], ["lounge", "duurzame"]],
  kenmerken: [["achter-auto-uit", null], ["gevel-front", "parkeerplaatsen"], ["terras-firma", "achterterrein"]],
  terrein: [["terras-firma", null], ["hoek-firma", "materiaal"]],
  vloer: [["hal-lang", null], ["opslag", "dus"]],
  parkeren: [["gevel-auto-in", null], ["gevel-reclame", "twee"]],
  deuren: [["achter-auto-uit", null], ["hal-lang", "dwars"]],
  locatie: [["luchtfoto-terrein", null], ["snelweg-gevel", "a27"], ["snelweg-avond", "100000"]],
  reistijd: [["luchtfoto-spoor", null]],
  onderhoud: [["hal-lang", null], ["hal-trap", "daar"], ["hal-kantoor", "vloeren"], ["hoek-avond", "jarenlang"]],
  planning: [["bouwplaats-spoor", null], ["gevel-avond", "oplevering"]],
  animo: [["hoek-avond", null], ["gevel-reclame", "wacht"]],
  cta: [["gevel-naam", null]],
};

// Afwijkingen per doelgroep
const SCENE_CLIPS_BODY: Record<number, Record<string, ClipList>> = {
  1: {
    prijs: [["gevel-naam", null], ["gevel-auto-in", "geen"], ["hoek-avond", "helemaal"]],
    laatste: [["luchtfoto-units", null], ["hoek-gevel", "300"]],
  },
  2: {
    prijs: [["gevel-auto-in", null], ["opslag", "vaste"], ["kantoor", "kantoor"]],
    laatste: [["luchtfoto-units", null], ["hal-lang", "300"], ["hal-trap", "beneden"], ["kantoor", "boven"]],
    locatie: [["luchtfoto-a27", null], ["snelweg-gevel", "klus"], ["gevel-naam", "gevel"]],
  },
  3: {
    prijs: [["gevel-naam", null], ["hoek-gevel", "bouw"], ["gevel-avond", "zonder"]],
    kenmerken: [["gevel-front", null], ["achter-auto-uit", "overheaddeuren"], ["terras-firma", "achterterrein"], ["entree-3", "huurders"]],
    locatie: [["snelweg-gevel", null], ["luchtfoto-a27", "100000"], ["luchtfoto-spoor", "hilversum"]],
  },
};

export const sceneClips = (body: number, scene: string): ClipList => SCENE_CLIPS_BODY[body]?.[scene] ?? SCENE_CLIPS[scene];

export const CTA_CLIP = "gevel-naam";

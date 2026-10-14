// Per body: welke renderclips bij welke hook en scène horen, en welke hookwoorden rood worden.
// Een clip-lijst is [clip, woord waarop naar deze clip wordt geknipt]; de eerste heeft null.
type ClipList = [string, string | null][];

export const BODIES: Record<number, number> = { 1: 5, 2: 5, 3: 5, 4: 3 }; // aantal hooks per body

export const HOOK_CLIPS: Record<number, Record<number, ClipList>> = {
  1: {
    1: [["binnenterrein-right", null]],
    2: [["woonkamer-woning-forward", null]],
    3: [["woonkamer-woning-eetkamer", null]],
    4: [["woonkamer-woning-right", null]],
    5: [["binnenterrein-forward", null]],
  },
  2: {
    1: [["voorgevel-woning", null]],
    2: [["woonkamer-woning-forward", null]],
    3: [["woonkamer-woning-right", null]],
    4: [["achterzijde-left", null]],
    5: [["woonkamer-woning-eetkamer", null]],
  },
  3: {
    1: [["woonkamer-woning-eetkamer", null]],
    2: [["woonkamer-woning-right", null]],
    3: [["voorgevel-woning", null]],
    4: [["achterzijde-left", null]],
    5: [["woonkamer-woning-forward", null]],
  },
  4: {
    1: [["voorgevel-appartement", null]],
    2: [["appartement-forward", null]],
    3: [["binnenterrein-forward", null]],
  },
};

export const HOOK_ACCENT: Record<number, Record<number, string[]>> = {
  1: {
    1: ["eigen", "parkeerplaats"],
    2: ["eigen", "plek"],
    3: ["3", "of", "4", "slaapkamers"],
    4: ["meer", "ruimte"],
    5: ["gasloos", "eigen", "parkeerplaats"],
  },
  2: {
    1: ["huislift"],
    2: ["traplopen", "lastiger"],
    3: ["rollator", "rolstoel"],
    4: ["toekomst"],
    5: ["eigen", "plek"],
  },
  3: {
    1: ["kantoor", "aan", "huis"],
    2: ["werken"],
    3: ["eigen", "woning"],
    4: ["wonen", "én", "werken"],
    5: ["eigen", "verdieping"],
  },
  4: {
    1: ["duurzaam"],
    2: ["duurzaam", "haven"],
    3: ["toekomstbestendig"],
  },
};

const SCENE_CLIPS: Record<string, ClipList> = {
  aanbod: [["achterzijde-left", null], ["voorgevel-woning", "vier"], ["voorgevel-appartement", "8"]],
  indeling: [["woonkamer-woning-eetkamer", null], ["woonkamer-woning-forward", "multifunctionele"], ["woonkamer-woning-right", "mantelzorgwoning"], ["voorgevel-woning", "vraag"]],
  serre: [["serre", null], ["voorgevel-woning", "uitzicht"]],
  achterdek: [["achterzijde-left", null]],
  parkeren: [["binnenterrein-forward", null], ["binnenterrein-right", "parkeerplaats"]],
  casco: [["woonkamer-woning-right", null], ["woonkamer-woning-eetkamer", "ruimte"]],
  gezin: [["woonkamer-woning-forward", null], ["voorgevel-woning", "visserskarakter"]],
  lift: [["voorgevel-woning", null], ["woonkamer-woning-forward", "verdiepingen"]],
  grond: [["woonkamer-woning-eetkamer", null], ["woonkamer-woning-right", "kantoor"]],
  lagen: [["voorgevel-woning", null], ["serre", "serre"], ["achterzijde-left", "terras"]],
  buiten: [["binnenterrein-forward", null], ["voorgevel-appartement", "balkon"]],
  duurzaam: [["appartement-pan", null], ["appartement-pushin", "vloerverwarming"]],
  animo: [["voorgevel-woning", null], ["achterzijde-left", "beschikbaar"]],
  cta: [["appartement-pushin-2", null]],
};

// Afwijkingen per body (body 4 gaat over de appartementen)
const SCENE_CLIPS_BODY: Record<number, Record<string, ClipList>> = {
  3: {
    animo: [["voorgevel-woning", null], ["serre", "kop"], ["achterzijde-left", "uitzicht"]],
  },
  4: {
    casco: [["appartement-left", null], ["appartement-forward", "ruimte"]],
    animo: [["voorgevel-appartement", null], ["binnenterrein-right", "beschikbaar"]],
  },
};

export const sceneClips = (body: number, scene: string): ClipList =>
  scene === "cta" ? [[ctaClip(body), null]] : SCENE_CLIPS_BODY[body]?.[scene] ?? SCENE_CLIPS[scene];

// Beeld in de afsluiter: appartement bij body 4, woning bij de andere bodies
export const ctaClip = (body: number) => (body === 4 ? "appartement-pushin-2" : "woonkamer-woning-forward");

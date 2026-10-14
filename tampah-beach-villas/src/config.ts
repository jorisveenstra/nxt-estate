// Per body: welke renderclips bij welke hook en scène horen, en welke hookwoorden gemarkeerd worden.
// Een clip-lijst is [clip, woord waarop naar deze clip wordt geknipt]; de eerste heeft null.
type ClipList = [string, string | null][];

export const BODIES: Record<number, number> = { 1: 5, 2: 5 }; // aantal hooks per body

export const HOOK_CLIPS: Record<number, Record<number, ClipList>> = {
  1: {
    1: [["lagune-strand", null], ["villa-zwembad", "den"], ["lagune-rij", "prinsjesdag"]],
    2: [["lagune-breed", null], ["zwembad-deck", "fictief"], ["lagune-push", "deze"], ["villa-parasol", "10"]],
    3: [["beachclub-strand", null], ["villa-zwembad-2", "tampah"], ["woonkamer-zwembad", "jij"]],
    4: [["villa-pad", null], ["buiten-lounge", "inflatie"], ["lagune-rij", "laat"]],
    5: [["villa-zwembad", null], ["lagune-push", "dan"]],
  },
  2: {
    1: [["lagune-rij", null], ["villa-tuin", "weet"]],
    2: [["zwembad-deck", null], ["buiten-lounge", "bouw"]],
    3: [["beachclub-pad", null], ["lagune-strand", "wil"]],
    4: [["villa-tuin", null], ["woonkamer-zwembad", "maar"], ["lagune-breed", "deze"]],
    5: [["lagune-strand", null], ["villa-parasol", "deze"], ["zwembad-deck", "10"]],
  },
};

export const HOOK_ACCENT: Record<number, Record<number, string[]>> = {
  1: {
    1: ["2028", "doorgeschoven."],
    2: ["6%?", "13%"],
    3: ["volledig", "niets"],
    4: ["1,3%", "3,3%."],
    5: ["wél"],
  },
  2: {
    1: ["nieuwe", "pensioenstelsel."],
    2: ["tweede", "inkomstenbron?"],
    3: ["één", "pot?"],
    4: ["oplossing!"],
    5: ["13%"],
  },
};

const SCENE_CLIPS: Record<string, ClipList> = {
  denhaag: [["villa-tuin", null], ["eettafel", "steeds"]],
  box3: [["tuin-villas", null], ["woonkamer", "box"]],
  buitenland: [["lagune-breed", null]],
  merk: [["lagune-push", null]],
  rendement: [["beachclub-strand", null], ["lagune-rij", "tampah"], ["villa-zwembad-2", "10"]],
  waarde: [["woonkamer-dak", null], ["slaapkamer-rond", "25"]],
  instap: [["villa-parasol", null], ["woonkamer-loft", "wij"]],
  masterplan: [["beachclub-pad", null], ["restaurant", "restaurant"], ["padel", "padelbanen"], ["jungle-gym", "jungle"]],
  verkocht: [["tuin-villas", null], ["badkamer-spiegels", "oplevering"], ["slaapkamer", "2028"]],
  genieten: [["buiten-lounge", null], ["slaapkamer-2", "gebruik"]],
  pensioen: [["woonkamer", null], ["eetkamer", "maar"]],
  vraag: [["restaurant-bar", null], ["beachclub-gebouw", "opleveren"]],
  cta: [["lagune-rij", null]],
};

const SCENE_CLIPS_BODY: Record<number, Record<string, ClipList>> = {};

export const sceneClips = (body: number, scene: string): ClipList => SCENE_CLIPS_BODY[body]?.[scene] ?? SCENE_CLIPS[scene];

export const CTA_CLIP = "lagune-rij";

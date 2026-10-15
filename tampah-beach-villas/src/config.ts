// Per body: welke renderclips bij welke hook en scène horen, en welke hookwoorden gemarkeerd worden.
// Een clip-lijst is [clip, woord waarop naar deze clip wordt geknipt]; de eerste heeft null.
type ClipList = [string, string | null][];

export const BODIES: Record<number, number> = { 1: 5, 2: 5 }; // aantal hooks per body

// Hooks over Nederland (Den Haag, box 3, bank, pensioen) krijgen Nederlandse beelden ("nl-…", Veo-renders);
// pas als de oplossing (Lombok/de villa's) ter sprake komt, gaan we naar de villa's.
export const HOOK_CLIPS: Record<number, Record<number, ClipList>> = {
  1: {
    1: [["nl-belastingbrief", null], ["nl-binnenhof", "den"], ["nl-binnenhof-plein", "prinsjesdag"]],
    2: [["nl-rijtjeshuizen", null], ["nl-papierwerk", "fictief"], ["lagune-push", "deze"], ["villa-parasol", "10"]],
    3: [["nl-verhuurder-sleutels", null], ["nl-binnenhof", "den"], ["villa-zwembad-2", "tampah"], ["woonkamer-zwembad", "jij"]],
    4: [["nl-bank-laptop", null], ["nl-euromunten", "inflatie"]],
    5: [["nl-kantoor-loonstrook", null], ["nl-euromunten", "dan"]],
  },
  2: {
    1: [["nl-pensioen-stel", null], ["nl-pensioen-raam", "weet"]],
    2: [["nl-pensioen-raam", null], ["nl-papierwerk", "maar"], ["villa-zwembad", "bouw"]],
    3: [["nl-pensioen-stel", null], ["nl-euromunten", "wil"]],
    4: [["nl-grachtenpanden", null], ["nl-papierwerk", "kost"], ["lagune-breed", "deze"]],
    5: [["nl-pensioen-raam", null], ["lagune-strand", "deze"], ["villa-parasol", "10"]],
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
  denhaag: [["nl-binnenhof", null], ["nl-binnenhof-plein", "steeds"]],
  box3: [["nl-rijtjeshuizen", null], ["nl-papierwerk", "box"]],
  buitenland: [["lagune-breed", null]],
  merk: [["lagune-push", null]],
  rendement: [["beachclub-strand", null], ["lagune-rij", "tampah"], ["villa-zwembad-2", "10"]],
  waarde: [["woonkamer-dak", null], ["slaapkamer-rond", "25"]],
  instap: [["villa-parasol", null], ["woonkamer-loft", "wij"]],
  masterplan: [["beachclub-pad", null], ["restaurant", "restaurant"], ["padel", "padelbanen"], ["jungle-gym", "jungle"]],
  verkocht: [["tuin-villas", null], ["badkamer-spiegels", "oplevering"], ["slaapkamer", "2028"]],
  genieten: [["buiten-lounge", null], ["slaapkamer-2", "gebruik"]],
  pensioen: [["nl-pensioen-stel", null], ["nl-papierwerk", "maar"]],
  vraag: [["restaurant-bar", null], ["beachclub-gebouw", "opleveren"]],
  cta: [["lagune-rij", null]],
};

const SCENE_CLIPS_BODY: Record<number, Record<string, ClipList>> = {};

export const sceneClips = (body: number, scene: string): ClipList => SCENE_CLIPS_BODY[body]?.[scene] ?? SCENE_CLIPS[scene];

export const CTA_CLIP = "lagune-rij";

// Per doelgroep (body): welke AI-clips (Veo 3.1, uit de bronfoto's) bij welke hook en scène horen, en welke hookwoorden groen gemarkeerd worden.
// Een clip-lijst is [clip, woord waarop naar deze clip wordt geknipt]; de eerste heeft null.
type ClipList = [string, string | null][];

export const BODIES: Record<number, number> = { 1: 5, 2: 5 }; // aantal hooks per body

export const HOOK_CLIPS: Record<number, Record<number, ClipList>> = {
  1: {
    1: [["ext-3", null]],
    2: [["bg-a1", null]],
    3: [["drone-2", null]],
    4: [["tv-c1", null]],
    5: [["drone-1", null]],
  },
  2: {
    1: [["bg-c1", null]],
    2: [["bg-d1", null]],
    3: [["ext-1", null]],
    4: [["bg-a1", null]],
    5: [["tv-a1", null]],
  },
};

export const HOOK_ACCENT: Record<number, Record<number, string[]>> = {
  1: {
    1: ["eigen", "pand", "erfpacht"],
    2: ["eigen", "pand", "huisvestingslasten"],
    3: ["eigen", "pand"],
    4: ["showroom", "studio"],
    5: ["bedrijfsvastgoed", "erfpachtcanon"],
  },
  2: {
    1: ["stroom", "netcongestie"],
    2: ["eigen", "pand"],
    3: ["eigen", "bedrijfspand"],
    4: ["inrichting", "zelf"],
    5: ["eigen", "stroomaansluiting"],
  },
};

const SCENE_CLIPS: Record<number, Record<string, ClipList>> = {
  1: {
    koop: [["drone-1", null]],
    erfpacht: [["ext-1", null]],
    units: [["ext-2", null], ["ext-4", "verdeeld"]],
    verdiepingen: [["bg-d1", null], ["tv-a1", "boven"]],
    kenmerken: [["ext-5", null], ["ext-6", "parkeerplaats"]],
    planning: [["drone-2", null]],
    cta: [["ext-6", null]],
  },
  2: {
    koop: [["drone-1", null]],
    stroom: [["bg-c1", null]],
    verdiepingen: [["bg-d1", null], ["tv-a1", "kantoor"]],
    deur: [["ext-3", null]],
    casco: [["bg-a1", null]],
    locatie: [["ext-6", null], ["drone-2", "A16"]],
    planning: [["ext-4", null]],
    cta: [["ext-6", null]],
  },
};

export const sceneClips = (body: number, scene: string): ClipList => SCENE_CLIPS[body][scene];

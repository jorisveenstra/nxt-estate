// Per doelgroep (body): welke renderclips bij welke hook en scène horen, en welke hookwoorden groen gemarkeerd worden.
// Een clip-lijst is [clip, woord waarop naar deze clip wordt geknipt]; de eerste heeft null.
type ClipList = [string, string | null][];

export const BODIES: Record<number, number> = { 1: 5, 2: 5, 3: 5 }; // aantal hooks per doelgroep

export const HOOK_CLIPS: Record<number, Record<number, ClipList>> = {
  1: {
    1: [["gevel-voorzijde-parkeren", null]],
    2: [["interieur-hal-studio", null]],
    3: [["gevel-brug", null]],
    4: [["hoek-fietser", null]],
    5: [["hoek-omhoog", null]],
  },
  2: {
    1: [["gevel-voorzijde-parkeren", null]],
    2: [["hoek-busjes", null]],
    3: [["entree-reclame", null]],
    4: [["hoek-fietser", null]],
    5: [["hoek-omhoog", null]],
  },
  3: {
    1: [["omgeving-overzicht", null]],
    2: [["omgeving-wijk", null]],
    3: [["overzicht-water", null]],
    4: [["interieur-werkplaats", null]],
    5: [["gevel-water", null]],
  },
};

export const HOOK_ACCENT: Record<number, Record<number, string[]>> = {
  1: {
    1: ["eigen", "bedrijfspand"],
    2: ["niet", "meer", "past"],
    3: ["eigen", "dakterras"],
    4: ["niks"],
    5: ["eigen", "pand"],
  },
  2: {
    1: ["eigen", "pand"],
    2: ["te", "klein"],
    3: ["verlengen"],
    4: ["omhoog"],
    5: ["eigen", "bedrijfspand"],
  },
  3: {
    1: ["bedrijfsvastgoed"],
    2: ["eerste", "stap"],
    3: ["bedrijfspand"],
    4: ["pensioenpot"],
    5: ["spreiden"],
  },
};

const SCENE_CLIPS: Record<string, ClipList> = {
  koop: [["gevel-voorzijde-parkeren", null], ["hoek-omhoog", "vanaf"]],
  eigen: [["hoek-fietser", null], ["entree-reclame", "maar"]],
  units: [["overzicht-water", null], ["gevel-water", "94"], ["interieur-kantoor", "bouwlagen"]],
  kenmerken: [["interieur-werkplaats", null], ["hoek-busjes", "overheaddeur"], ["gevel-voorzijde-auto", "parkeerplaatsen"]],
  locatie: [["opbouw-winkel", null], ["omgeving-snelweg", "n470"], ["omgeving-wijk", "ideaal"]],
  planning: [["opbouw-exterieur", null], ["straat-hoek", "oplevering"]],
  animo: [["gevel-brug", null], ["opbouw-hal", "wacht"]],
  cta: [["interieur-hal-fotograaf", null]],
};

// Afwijkingen per doelgroep
const SCENE_CLIPS_BODY: Record<number, Record<string, ClipList>> = {
  3: {
    locatie: [["opbouw-winkel", null], ["omgeving-snelweg", "n470"], ["omgeving-overzicht", "goed"]],
  },
};

export const sceneClips = (body: number, scene: string): ClipList => SCENE_CLIPS_BODY[body]?.[scene] ?? SCENE_CLIPS[scene];

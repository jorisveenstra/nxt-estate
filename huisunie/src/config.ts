// Per body: welke clips bij welke hook en scène horen, en welke hookwoorden blauw gemarkeerd worden.
// Een clip-lijst is [clip, woord waarop naar deze clip wordt geknipt]; de eerste heeft null.
// "ai-…" zijn de AI-renders van de woning (Veo 3.1), de overige clips zijn aangeleverd.
type ClipList = [string, string | null][];

export const BODIES: Record<number, number> = { 1: 6, 2: 3, 3: 3 };

export const HOOK_CLIPS: Record<number, Record<number, ClipList>> = {
  1: {
    1: [["ai-voorgevel", null], ["houtrot", "achterstallig"], ["oude-keuken", "opknapbeurt"], ["ai-keuken-2", "maar"]],
    2: [["gevel-gedateerd", null], ["dakgoot", "achterstallig"], ["oude-badkamer", "opknapbeurt"], ["ai-woonkamer-2", "maar"]],
    3: [["ai-achtergevel-tuin", null], ["scheur", "achterstallig"], ["vochtplek", "opknapbeurt"], ["oude-cv", "maar"]],
    4: [["verkoopbord", null]],
    5: [["gevel-gedateerd", null], ["ai-badkamer-douche", "verkoopklaar"]],
    6: [["oude-keuken", null], ["oude-badkamer", "badkamer"]],
  },
  2: {
    1: [["ai-voorgevel", null], ["dakgoot", "achterstallig"], ["oude-keuken", "opknapbeurt"], ["verhuisdozen", "wilt"]],
    2: [["gevel-gedateerd", null], ["houtrot", "achterstallig"], ["oude-badkamer", "opknapbeurt"], ["verkoopbord", "wilt"]],
    3: [["ai-achtergevel-tuin", null], ["scheur", "achterstallig"], ["vochtplek", "opknapbeurt"], ["oud-echtpaar", "wilt"]],
  },
  3: {
    1: [["oud-echtpaar", null], ["oude-keuken", "opknapbeurt"]],
    2: [["man-ouderlijk-huis", null], ["zolder-vol", "kleiner"]],
    3: [["ai-hal-voordeur", null], ["volle-woonkamer", "opknappen"]],
  },
};

const FILTER = ["gedateerd", "achterstallig", "opknapbeurt"];
export const HOOK_ACCENT: Record<number, Record<number, string[]>> = {
  1: {
    1: [...FILTER, "opknappen"],
    2: [...FILTER, "tijd", "geld"],
    3: [...FILTER, "reparaties"],
    4: ["zonder", "verbouwen"],
    5: ["zonder", "verbouwen"],
    6: ["gedateerd", "geen", "behoefte"],
  },
  2: {
    1: [...FILTER, "verhuizen"],
    2: [...FILTER, "zekerheid"],
    3: [...FILTER, "blijven", "wonen"],
  },
  3: {
    1: ["55plus", "opknapbeurt"],
    2: ["kleiner", "wonen"],
    3: ["gelijkvloers", "opknappen", "opruimen"],
  },
};

export const CTA_CLIP = "ai-achtertuin-2";

const SCENE_CLIPS: Record<string, ClipList> = {
  zoals: [["ai-woonkamer-1", null]],
  niets: [["ai-keuken-1", null], ["ai-zolder", "ruimen"]],
  spullen: [["volle-woonkamer", null], ["boekenkast", "laten"]],
  voorbehoud: [["handen-document", null], ["gesprek-adviseur", "bouwkundige"]],
  zekerheid: [["verkoopbord", null]],
  gebreken: [["scheur", null], ["ai-badkamer-douche", "risico"]],
  blijven: [["ai-eettafel", null], ["ai-woonkamer-2", "jaar"]],
  kosten: [["gesprek-adviseur", null], ["sleuteloverdracht", "notariskosten"]],
  bod: [["handen-document", null], ["ai-drone", "vrijblijvend"]],
  cta: [[CTA_CLIP, null]],
};

// Body 3 heeft een kortere zin over opknappen/opruimen: daar één clip
const SCENE_CLIPS_BODY: Record<number, Record<string, ClipList>> = {
  3: { niets: [["ai-keuken-1", null]] },
};

export const sceneClips = (body: number, scene: string): ClipList => SCENE_CLIPS_BODY[body]?.[scene] ?? SCENE_CLIPS[scene];

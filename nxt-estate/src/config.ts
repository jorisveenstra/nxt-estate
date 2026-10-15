// Per body (V2–V4): welke renders bij welke hook en scène horen, en welke hookwoorden roze gemarkeerd worden.
// Een clip-lijst is [clip, woord waarop naar deze clip wordt geknipt]; de eerste heeft null.
// Clips: p<project>-<n> = AI-renders van kantoorunits uit project 1 t/m 4.
type ClipList = [string, string | null][];

export const BODIES: Record<number, number> = { 1: 3, 2: 3, 3: 3, 4: 3 };

export const HOOK_CLIPS: Record<number, Record<number, ClipList>> = {
  1: {
    1: [["p2-1", null]],
    2: [["p4-4", null], ["p1-1", "verkoop"]],
    3: [["p3-3", null], ["p2-2", "leads"]],
  },
  2: {
    1: [["p4-2", null], ["p1-1", "partijen"]],
    2: [["p2-1", null], ["p3-3", "kantoorunits"]],
    3: [["p4-4", null], ["p1-2", "gebeurt"]],
  },
  3: {
    1: [["p3-4", null], ["p2-2", "maar"]],
    2: [["p1-3", null], ["p4-1", "plaats"]],
    3: [["p3-1", null], ["p2-3", "maar"]],
  },
  4: {
    1: [["p4-2", null], ["p1-1", "weinig"]],
    2: [["p2-1", null], ["p3-3", "maar"]],
    3: [["p4-4", null], ["p1-2", "niet"]],
  },
};

export const HOOK_ACCENT: Record<number, Record<number, string[]>> = {
  1: { 1: ["kantoorunits"], 2: ["meerdere", "kantoorunits"], 3: ["serieuze", "interesse"] },
  2: { 1: ["meerdere", "partijen"], 2: ["hoeveel", "partijen"], 3: ["leads", "gebeurt"] },
  3: { 1: ["niets", "mee"], 2: ["leads", "verkopen"], 3: ["geen", "kopers"] },
  4: { 1: ["weinig", "aanvragen"], 2: ["stil"], 3: ["juiste", "kopers"] },
};

export const CTA_CLIP = "p2-3";

const SCENE_CLIPS: Record<string, ClipList> = {
  belofte: [["p1-4", null], ["p2-4", "kopers"]],
  eilandjes: [["p3-2", null]],
  schip: [["p2-2", null]],
  partner: [["p4-3", null], ["p1-4", "advertentie"]],
  grip: [["p2-4", null]],
  geenlead: [["p2-4", null]],
  partners: [["p3-3", null], ["p4-2", "sneller"]],
  stoppen: [["p3-2", null], ["p1-3", "lijst"]],
  vragen: [["p4-3", null]],
  verloren: [["p2-3", null]],
  agenda: [["p1-4", null]],
  belteam: [["p3-2", null], ["p4-4", "checkt"]],
  cases: [["p1-1", null], ["p3-1", "dordrecht"]],
  helft: [["p2-1", null], ["p4-3", "binnenkomen"]],
  leeg: [["p3-4", null]],
  systeem: [["p1-2", null], ["p2-4", "aanvraag"]],
  vol: [["p4-3", null]],
  meer: [["p2-2", null]],
  mis: [["p3-4", null], ["p4-1", "nagebeld"]],
  idee: [["p2-3", null]],
  systeem1: [["p1-3", null], ["p4-3", "bouwen"]],
  gesprekken: [["p1-4", null], ["p2-4", "geen"]],
  cta: [[CTA_CLIP, null]],
};

// V1 heeft dezelfde scènes maar met andere zinsvolgorde: daar eerder knippen
const SCENE_CLIPS_BODY: Record<number, Record<string, ClipList>> = {
  1: {
    cases: [["p1-1", null], ["p3-1", "behaalden"]],
    partners: [["p3-3", null], ["p4-2", "verkopen"]],
  },
};

export const sceneClips = (body: number, scene: string): ClipList => SCENE_CLIPS_BODY[body]?.[scene] ?? SCENE_CLIPS[scene];

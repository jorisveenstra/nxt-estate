// Welke clip bij welke hook/zin hoort, en welke korte accenten (chips) in beeld komen.
// Clips: [naam, startseconde in de clip]. Is een zin langer dan ~6,5 s, dan wordt hij hard
// geknipt over de clips in de lijst (geen overgangen). Alle clips zijn Veo 3.1 image-to-video
// van de verkoopbrochure-impressies (zie scripts/veo-ledger.json), native 1080x1920.
// Bruikbare lengte per clip staat in Video.tsx (USABLE); kinderkamer is niet gegenereerd (ElevenLabs-quota).
export type Clip = [string, number];
export type Icon = "huis" | "zon" | "accu" | "systeem" | "bliksem" | "kalender" | "pin" | "boom" | "gezin" | "sleutel" | "plattegrond";
export type Chip = { at: string; text: string; icon: Icon };
export type SceneCfg = { clips: Clip[]; chips?: Chip[] };

export const ENERGIE: Chip[] = [
  { at: "twaalf", text: "12 zonnepanelen", icon: "zon" },
  { at: "accupakket", text: "Accupakket", icon: "accu" },
  { at: "home", text: "Home management system", icon: "systeem" },
];

export const BODY: Record<number, Record<string, SceneCfg>> = {
  1: {
    z1: { clips: [["hoek-bewoners", 0.3], ["straat-hoekwoning", 0.4]], chips: [{ at: "achttien", text: "18 nieuwe woningen", icon: "huis" }] },
    z2: { clips: [["laan-gezinnen", 0.3], ["straat-hoekwoning", 4.6]], chips: [{ at: "grondgebonden", text: "Tussen- & hoekwoningen", icon: "huis" }, { at: "voordeur", text: "Eigen voordeur", icon: "sleutel" }] },
    z3: { clips: [["groen-avondzon", 0], ["laan-gezinnen", 3.0]], chips: ENERGIE },
    z4: { clips: [["woonkamer", 0.3], ["slaapkamer", 0.5]], chips: [{ at: "tien", text: "10 ampère-aansluiting", icon: "bliksem" }] },
    z5: { clips: [["plattegrond-bg", 0.3], ["straat-hoekwoning", 4.0]], chips: [{ at: "makelaar", text: "Uitleg van de makelaar", icon: "pin" }] },
    z6: { clips: [["hoek-bewoners", 4.2]], chips: [{ at: "oplevering", text: "Oplevering herfst 2027", icon: "kalender" }] },
    z7: { clips: [["slaapkamer", 2.0], ["woonkamer", 4.0]] },
    cta: { clips: [["straat-hoekwoning", 2.0], ["hoek-bewoners", 2.0]] },
  },
  2: {
    z1: { clips: [["laan-gezinnen", 0.3], ["groen-avondzon", 0.3]], chips: [{ at: "kleinschalig", text: "Kleinschalig: 18 woningen", icon: "huis" }] },
    z2: { clips: [["straat-hoekwoning", 0.4], ["hoek-bewoners", 3.0]], chips: [{ at: "grondgebonden", text: "Tussen- & hoekwoningen", icon: "huis" }, { at: "voordeur", text: "Eigen voordeur", icon: "sleutel" }] },
    z3: { clips: [["laan-gezinnen", 3.5], ["hoek-bewoners", 4.0]], chips: [{ at: "centraal", text: "Centraal in Heerenveen", icon: "pin" }] },
    z4: { clips: [["groen-avondzon", 0], ["woonkamer", 0.5]], chips: [{ at: "groen", text: "Groene laan", icon: "boom" }] },
    z5: { clips: [["hoek-bewoners", 0.3]], chips: ENERGIE },
    z6: { clips: [["plattegrond-bg", 0.3], ["slaapkamer", 0.5]], chips: [{ at: "ingedeeld", text: "Bekijk de indeling", icon: "plattegrond" }] },
    z7: { clips: [["woonkamer", 3.5]], chips: [{ at: "oplevering", text: "Oplevering herfst 2027", icon: "kalender" }] },
    cta: { clips: [["laan-gezinnen", 1.5], ["straat-hoekwoning", 1.0]] },
  },
  3: {
    z1: { clips: [["hoek-bewoners", 0.3], ["groen-avondzon", 0.3]], chips: [{ at: "achttien", text: "18 grondgebonden woningen", icon: "huis" }] },
    z2: { clips: [["straat-hoekwoning", 0.4], ["laan-gezinnen", 0.3]], chips: [{ at: "tussenwoning", text: "Tussen- of hoekwoning", icon: "huis" }] },
    z3: { clips: [["groen-avondzon", 0], ["hoek-bewoners", 3.5]], chips: [{ at: "oplevering", text: "Oplevering herfst 2027", icon: "kalender" }] },
    z4: { clips: [["woonkamer", 0.3]], chips: [{ at: "verkoop", text: "Verkoop rustig plannen", icon: "sleutel" }] },
    z5: { clips: [["laan-gezinnen", 3.5]], chips: ENERGIE },
    z6: { clips: [["slaapkamer", 0.5], ["woonkamer", 2.5]], chips: [{ at: "tien", text: "10 ampère-aansluiting", icon: "bliksem" }] },
    z7: { clips: [["plattegrond-bg", 0.3], ["woonkamer", 4.0]], chips: [{ at: "makelaar", text: "Eerlijke uitleg", icon: "pin" }] },
    cta: { clips: [["straat-hoekwoning", 2.0], ["hoek-bewoners", 2.0]] },
  },
};

// Hooks: korte clipreeks + rood gemarkeerde woorden + label bovenin
export type HookCfg = { clips: Clip[]; accent: string[]; tag: string };
export const HOOK: Record<number, Record<number, HookCfg>> = {
  1: {
    1: { clips: [["straat-hoekwoning", 0]], accent: ["eerste", "eigen", "koopwoning,"], tag: "Nieuwbouw in Heerenveen" },
    2: { clips: [["laan-gezinnen", 0]], accent: ["huren", "eigen", "voordeur"], tag: "Starters opgelet" },
    3: { clips: [["groen-avondzon", 0], ["laan-gezinnen", 2.0]], accent: ["zonnepanelen", "accu,"], tag: "Nieuwbouw in Heerenveen" },
    4: { clips: [["hoek-bewoners", 0]], accent: ["President", "Kennedylaan"], tag: "In aanbouw" },
    5: { clips: [["woonkamer", 0], ["slaapkamer", 0.3]], accent: ["haalbaar"], tag: "Je eerste huis" },
  },
  2: {
    1: { clips: [["laan-gezinnen", 0], ["hoek-bewoners", 2.5]], accent: ["gezin,", "rustig", "centraal"], tag: "Wonen met je gezin" },
    2: { clips: [["groen-avondzon", 0], ["laan-gezinnen", 2.0]], accent: ["groene", "laan,"], tag: "Nieuwbouw in Heerenveen" },
    3: { clips: [["hoek-bewoners", 0]], accent: ["buiten", "spelen?"], tag: "Wonen met je gezin" },
    4: { clips: [["laan-gezinnen", 0]], accent: ["Achttien", "groene", "laan"], tag: "President Kennedylaan" },
    5: { clips: [["plattegrond-bg", 0], ["woonkamer", 0]], accent: ["vergelijken"], tag: "Kies bewust" },
  },
  3: {
    1: { clips: [["hoek-bewoners", 0]], accent: ["nieuw", "Heerenveen"], tag: "Nieuwbouw in Heerenveen" },
    2: { clips: [["straat-hoekwoning", 0]], accent: ["verhuizen,", "verkopen?"], tag: "Doorstromen" },
    3: { clips: [["straat-hoekwoning", 0], ["laan-gezinnen", 0.3]], accent: ["Tussenwoning", "hoekwoning:"], tag: "President Kennedylaan" },
    4: { clips: [["woonkamer", 0], ["slaapkamer", 0.3]], accent: ["tien", "ampère?", "eerlijk"], tag: "Eerlijk advies" },
    5: { clips: [["groen-avondzon", 0], ["laan-gezinnen", 0.3]], accent: ["zonnepanelen", "accupakket,"], tag: "Nieuwbouw in Heerenveen" },
  },
};

// Accentwoorden in de body-ondertitels (rood)
export const BODY_ACCENT = ["achttien", "grondgebonden", "voordeur", "twaalf", "zonnepanelen", "accupakket", "tien", "ampère", "ampère,",
  "herfst", "2027.", "hypotheek.", "groene", "centraal", "rust,", "hoekwoning", "tussenwoning", "rustig", "RMW", "afspraak"];

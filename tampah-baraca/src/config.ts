// Beeldplan en grafische accenten. Alleen Baraca Village-beelden (uitdrukkelijke wens van de klant):
// tien 4K-renderanimaties, staand bijgesneden tot 1080x1920 (scripts/prep_clips.sh), en drie bestaande
// native 9:16 Veo-clips uit de Frame.io-bronnenbibliotheek. Alleen harde cuts tussen shots.

export const CLIP_SECONDS: Record<string, number> = {
  "drone-naar-zee": 8, "drone-orbit": 8, "villa-gordijnen": 8, "villa-twee-lagen": 8, "villa-zwembad": 8,
  villastraat: 8, badkamer: 8, speeltuin: 8,
  "gemeenschappelijk-zwembad": 5, keuken: 5, "poort-kinderen": 5, slaapkamer: 5, woonkamer: 5,
};

// [clipnaam, beginpunt in de clip (s)]
export type Shot = [string, number];

export type Accent =
  | { kind: "pin"; text: string; sub?: string }
  | { kind: "chips"; items: string[]; title?: string }
  | { kind: "stat"; value: string; label: string; sub?: string }
  | { kind: "steps"; title: string; items: string[] }
  | { kind: "trend"; text: string; sub?: string }
  | { kind: "note"; text: string }
  | { kind: "cta"; text: string };

type Plan = { shots: Shot[]; accent?: Accent };

const PIN: Accent = { kind: "pin", text: "Tampah Bay", sub: "Zuid-Lombok, Indonesië" };

// Per body: per zin (laatste = CTA) de shots en het accent.
export const BODY_PLAN: Record<number, Plan[]> = {
  1: [
    { shots: [["drone-naar-zee", 0]], accent: PIN },
    { shots: [["villa-zwembad", 0], ["villa-gordijnen", 1]], accent: { kind: "chips", items: ["Vrijstaande villa's", "Zelf gebruiken", "Of verhuren"] } },
    { shots: [["woonkamer", 0], ["gemeenschappelijk-zwembad", 0]], accent: { kind: "stat", value: "7,5% – 12%", label: "geraamd netto huurrendement", sub: "lang verblijf 7,5% · kort verblijf tot 12%" } },
    { shots: [["villa-twee-lagen", 0]], accent: { kind: "note", text: "Prognose, geen garantie" } },
    { shots: [["slaapkamer", 0]], accent: { kind: "stat", value: "€ 165.000", label: "instap vanaf", sub: "villa met één slaapkamer" } },
    { shots: [["keuken", 0], ["badkamer", 1]], accent: { kind: "steps", title: "4 gelijke termijnen", items: ["Ondertekening", "Na 6 maanden", "Na 12 maanden", "Overdracht"] } },
    { shots: [["drone-orbit", 0]], accent: { kind: "trend", text: "Prijzen bewegen mee met de bouw", sub: "Eerder instappen = eerder vastleggen" } },
    { shots: [["villastraat", 0]], accent: { kind: "chips", title: "Eigendom", items: ["PT PMA", "HGB-titel", "Overdraagbaar", "Verlengbaar"] } },
    { shots: [["gemeenschappelijk-zwembad", 2.5]] },
    { shots: [["drone-naar-zee", 3]], accent: { kind: "trend", text: "Internationaal toerisme in groei", sub: "Zuid-Lombok bereidt zich voor" } },
    { shots: [["villa-zwembad", 3.5]], accent: { kind: "cta", text: "Vraag het investeringsplan aan" } },
  ],
  2: [
    { shots: [["drone-naar-zee", 0]], accent: PIN },
    { shots: [["drone-orbit", 0]], accent: { kind: "trend", text: "Internationaal toerisme in groei" } },
    { shots: [["villastraat", 0], ["gemeenschappelijk-zwembad", 0]], accent: { kind: "chips", title: "Lombok op de kaart", items: ["Nieuwe vliegroutes", "Mandalika-zone", "MotoGP-circuit"] } },
    { shots: [["drone-naar-zee", 3.5]], accent: { kind: "chips", items: ["Kustpercelen schaarser", "Grondprijzen stijgen"] } },
    { shots: [["speeltuin", 0], ["villa-twee-lagen", 0]], accent: { kind: "chips", items: ["Volledig masterplan", "Vrijstaande villa's"] } },
    { shots: [["villa-zwembad", 0]], accent: { kind: "trend", text: "Prijzen bewegen mee met de bouw", sub: "Beschikbaarheid nu beperkt" } },
    { shots: [["villa-gordijnen", 0]], accent: { kind: "note", text: "Geen garantie dat Lombok Bali volgt" } },
    { shots: [["woonkamer", 0]], accent: { kind: "chips", items: ["Eerst het volledige beeld", "Dan pas besluiten"] } },
    { shots: [["slaapkamer", 0], ["badkamer", 2]], accent: { kind: "cta", text: "Vraag het investeringsplan aan" } },
  ],
  3: [
    { shots: [["drone-naar-zee", 0]], accent: PIN },
    { shots: [["villa-zwembad", 0], ["villa-twee-lagen", 0]], accent: { kind: "chips", title: "Vrijstaande villa's", items: ["1 slaapkamer", "2 slaapkamers", "3 slaapkamers"] } },
    { shots: [["drone-orbit", 0]], accent: { kind: "chips", items: ["Strand · 5 min", "Luchthaven · ± 45 min"] } },
    { shots: [["poort-kinderen", 0]], accent: { kind: "chips", title: "Op het terrein", items: ["Sauna", "Sportschool", "Afgesloten ingang"] } },
    { shots: [["villastraat", 0]], accent: { kind: "chips", items: ["Rust", "Heuvels", "Rijstvelden"] } },
    { shots: [["gemeenschappelijk-zwembad", 0]], accent: { kind: "note", text: "Niet zelf? Dan verhuren" } },
    { shots: [["woonkamer", 0], ["slaapkamer", 0]], accent: { kind: "stat", value: "tot 12%", label: "geraamd netto huurrendement", sub: "kort verblijf · prognose, geen garantie" } },
    { shots: [["villa-gordijnen", 0]], accent: { kind: "stat", value: "€ 205.000", label: "vanaf", sub: "villa met twee slaapkamers" } },
    { shots: [["keuken", 0], ["badkamer", 1]], accent: { kind: "chips", title: "Vooraf afgestemd", items: ["Verhuur", "Beheer", "Eigen weken"] } },
    { shots: [["villa-zwembad", 3.5]], accent: { kind: "cta", text: "Bekijk plattegronden en prijzen" } },
  ],
};

export const HOOK_PLAN: Record<number, Record<number, Plan>> = {
  1: {
    1: { shots: [["villa-gordijnen", 0]] },
    2: { shots: [["villa-zwembad", 0]], accent: { kind: "stat", value: "7,5% – 12%", label: "geraamd netto rendement" } },
    3: { shots: [["villa-twee-lagen", 0], ["slaapkamer", 0]], accent: { kind: "stat", value: "€ 165.000", label: "vanaf · in 4 gelijke delen" } },
    4: { shots: [["villastraat", 0]] },
    5: { shots: [["drone-orbit", 0]], accent: { kind: "pin", text: "Lombok", sub: "Indonesië" } },
  },
  2: {
    1: { shots: [["gemeenschappelijk-zwembad", 0]] },
    2: { shots: [["drone-orbit", 0]] },
    3: { shots: [["villastraat", 0], ["drone-orbit", 2]], accent: { kind: "chips", items: ["MotoGP-circuit", "Nieuwe vliegroutes", "Economische zone"] } },
    4: { shots: [["villa-zwembad", 0]] },
    5: { shots: [["drone-orbit", 2]], accent: { kind: "pin", text: "Zuid-Lombok", sub: "Kustpercelen worden schaarser" } },
  },
  3: {
    1: { shots: [["villa-zwembad", 0]] },
    2: { shots: [["woonkamer", 0], ["villa-gordijnen", 0]] },
    3: { shots: [["gemeenschappelijk-zwembad", 0]] },
    4: { shots: [["drone-orbit", 0]], accent: { kind: "chips", items: ["Vrijstaande villa", "Strand · 5 min"] } },
    5: { shots: [["woonkamer", 0]] },
  },
};

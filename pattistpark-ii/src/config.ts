// Welke bibliotheekclip (public/clips/<naam>.mp4) bij welke hook en zin hoort, plus de grafische accenten.
// Alle clips komen uit de Frame.io-bronnenbibliotheek van Pattistpark II (zie scripts/clips-herkomst.json).
export type Accent =
  | { kind: "stat"; big: string; label: string; icon?: string }
  | { kind: "chips"; items: { icon: string; text: string }[] }
  | { kind: "price"; lines: string[] }
  | { kind: "cta" };

export type ScenePlan = { clips: string[]; accent?: Accent };

export const HOOK_CLIPS: Record<string, string> = {
  b1h1: "woonwijk",
  b1h2: "keuken-f",
  b1h3: "woon-a",
  b1h4: "woonwijk",
  b1h5: "zonsondergang",
  b2h1: "woon-d",
  b2h2: "toren-park",
  b2h3: "balkon-d",
  b2h4: "bouw-lucht",
  b2h5: "woonwijk",
  b3h1: "kust",
  b3h2: "balkon-d",
  b3h3: "woonwijk",
  b3h4: "zonsondergang",
  b3h5: "woon-a",
};

const prijs: Accent = { kind: "price", lines: ["Vanaf €484.950", "Oplevering Q2 2027"] };
const duurzaam: Accent = {
  kind: "chips",
  items: [
    { icon: "leaf", text: "Gasloos" },
    { icon: "floor", text: "Vloerverwarming & -koeling" },
    { icon: "bolt", text: "Energielabel A+++" },
  ],
};
const cta: ScenePlan = { clips: ["balkon-d"], accent: { kind: "cta" } };

export const BODY_PLAN: Record<string, Record<string, ScenePlan>> = {
  b1: {
    toren: { clips: ["torens-dijk"], accent: { kind: "stat", big: "88", label: "luxe appartementen aan de Scheldeboulevard" } },
    lift: { clips: ["toren-park"], accent: { kind: "chips", items: [{ icon: "lift", text: "Lift naar uw verdieping" }, { icon: "level", text: "Helemaal gelijkvloers" }] } },
    balkon: { clips: ["balkon-ontbijt"], accent: { kind: "chips", items: [{ icon: "nogarden", text: "Geen tuinonderhoud" }, { icon: "sun", text: "Eigen balkon met uitzicht" }] } },
    winkels: { clips: ["bouw-lucht"], accent: { kind: "chips", items: [{ icon: "bag", text: "Winkelcentrum vlakbij" }, { icon: "pin", text: "Binnenstad om de hoek" }] } },
    duurzaam: { clips: ["woon-d"], accent: duurzaam },
    twijfel: { clips: ["woonwijk"], accent: { kind: "chips", items: [{ icon: "house", text: "Verkoop huidige woning?" }, { icon: "euro", text: "Financiering?" }] } },
    makelaar: { clips: ["woon-a"], accent: { kind: "chips", items: [{ icon: "people", text: "Makelaars uit Terneuzen" }, { icon: "chart", text: "Verkoopbaarheid & leencapaciteit" }] } },
    prijs: { clips: ["zonsondergang", "torens-dijk"], accent: prijs },
    cta,
  },
  b2: {
    veilig: { clips: ["torens-dijk"], accent: { kind: "chips", items: [{ icon: "shield", text: "Veiligheid voorop" }, { icon: "heart", text: "Comfort voorop" }] } },
    entree: { clips: ["toren-park"], accent: { kind: "chips", items: [{ icon: "door", text: "Centrale entree" }, { icon: "monitor", text: "Videomonitor in uw hal" }] } },
    garage: { clips: ["bouw-lucht"], accent: { kind: "chips", items: [{ icon: "car", text: "Afgesloten parkeergarage" }, { icon: "bike", text: "Ook voor uw fiets" }] } },
    lift: { clips: ["woon-a"], accent: { kind: "chips", items: [{ icon: "lift", text: "Met de lift naar uw verdieping" }] } },
    duurzaam: { clips: ["woon-d"], accent: duurzaam },
    zorg: { clips: ["balkon-ontbijt"], accent: { kind: "chips", items: [{ icon: "care", text: "Zorg binnen handbereik" }] } },
    makelaar: { clips: ["keuken-f"], accent: { kind: "chips", items: [{ icon: "people", text: "Makelaar neemt rustig de tijd" }, { icon: "chat", text: "Al uw vragen beantwoord" }] } },
    prijs: { clips: ["zonsondergang", "torens-dijk"], accent: prijs },
    cta,
  },
  b3: {
    toren: { clips: ["torens-dijk"], accent: { kind: "stat", big: "88", label: "luxe appartementen aan de Westerschelde" } },
    uitzicht: { clips: ["balkon-d", "balkon-ontbijt"], accent: { kind: "chips", items: [{ icon: "water", text: "Het water" }, { icon: "tree", text: "De Otheense Kreek" }, { icon: "lock", text: "De sluizen of de stad" }] } },
    stad: { clips: ["bouw-lucht"], accent: { kind: "chips", items: [{ icon: "walk", text: "Scheldeboulevard" }, { icon: "cup", text: "Terras & markt" }, { icon: "boat", text: "Jachthaven" }] } },
    regio: { clips: ["kust"], accent: { kind: "chips", items: [{ icon: "pin", text: "Middelburg" }, { icon: "pin", text: "Antwerpen" }, { icon: "pin", text: "Gent" }] } },
    garage: { clips: ["toren-park"], accent: { kind: "chips", items: [{ icon: "car", text: "Garages in de kelder" }, { icon: "box", text: "Eigen berging" }] } },
    duurzaam: { clips: ["keuken-f"], accent: { kind: "chips", items: [{ icon: "leaf", text: "Gasloos" }, { icon: "bolt", text: "Energielabel A+++" }] } },
    makelaar: { clips: ["woonwijk"], accent: { kind: "chips", items: [{ icon: "people", text: "Makelaars denken mee" }, { icon: "house", text: "Over de verkoop van uw woning" }] } },
    prijs: { clips: ["zonsondergang"], accent: { kind: "price", lines: ["Vanaf €484.950", "88 appartementen"] } },
    cta: { clips: ["balkon-ontbijt"], accent: { kind: "cta" } },
  },
};

// Startpunt in elke clip (s): de allereerste frames overslaan
export const CLIP_OFFSET = 0.3;
export const HOOK_PAUSE = 0.45; // stilte tussen hook en body
export const TAIL = 2.0; // eindbeeld na de CTA

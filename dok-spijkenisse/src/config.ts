export type Chip = { at: string; text: string; color?: "green" | "orange" | "khaki" | "navy" };
export type SceneCfg = { clips: string[]; chips?: Chip[]; steps?: { at: string; count: number } };

export const BODY: Record<number, Record<string, SceneCfg>> = {
  1: {
    intro: { clips: ["corner_b", "fac_straight_2"], chips: [{ at: "bedrijfsunit", text: "Eigen bedrijfsunit", color: "green" }, { at: "alleen", text: "Je staat er niet alleen voor", color: "navy" }] },
    team: { clips: ["reception_2", "interior_build"], chips: [{ at: "begeleidt", text: "Persoonlijke begeleiding", color: "green" }, { at: "hypotheek", text: "Hypotheek", color: "khaki" }, { at: "inrichting", text: "Inrichting van je unit", color: "khaki" }] },
    unit: { clips: ["push_in", "van_unit_pan", "corner_right"], chips: [{ at: "88", text: "88 m²", color: "orange" }, { at: "lagen", text: "2 lagen", color: "navy" }, { at: "overheaddeur", text: "Hoge overheaddeur", color: "khaki" }, { at: "parkeerplaatsen", text: "2 eigen parkeerplaatsen", color: "green" }] },
    energie: { clips: ["terrace_office", "terrace_pan"], chips: [{ at: "energiezuinig", text: "Energiezuinig", color: "green" }, { at: "gasloos", text: "Gasloos", color: "navy" }, { at: "stroom", text: "Startklaar met stroom", color: "orange" }] },
    stappen: { clips: ["reception_1", "intersect_2"], steps: { at: "vier", count: 4 }, chips: [{ at: "makelaar", text: "Persoonlijk contact met de makelaar", color: "green" }] },
    planning: { clips: ["construction", "drone_pan"], chips: [{ at: "2026", text: "Bouwstart 2026", color: "navy" }, { at: "2027", text: "Oplevering 2027", color: "orange" }] },
    slot: { clips: ["corner_a", "intersect_down"], chips: [{ at: "eigen", text: "Je eigen pand", color: "green" }] },
    cta: { clips: ["fac_straight_1", "drone_pullback", "corner_b"] },
  },
  2: {
    intro: { clips: ["fac_straight_2", "corner_a"], chips: [{ at: "bedrijfsunit", text: "Eigen bedrijfsunit", color: "green" }, { at: "189500", text: "Vanaf € 189.500", color: "orange" }] },
    unit: { clips: ["push_in", "van_unit_pan"], chips: [{ at: "88", text: "88 m²", color: "orange" }, { at: "lagen", text: "2 lagen", color: "navy" }, { at: "overheaddeur", text: "Hoge overheaddeur", color: "khaki" }, { at: "robuuste", text: "Robuuste bouwkwaliteit", color: "green" }] },
    twijfel: { clips: ["van_unit", "interior_build"], chips: [{ at: "materiaal", text: "Materiaal", color: "khaki" }, { at: "gereedschap", text: "Gereedschap", color: "navy" }, { at: "administratie", text: "Administratie", color: "khaki" }] },
    team: { clips: ["reception_1", "reception_2"], chips: [{ at: "persoonlijk", text: "Persoonlijk meedenken", color: "green" }, { at: "inrichting", text: "Slim ingericht", color: "navy" }] },
    fin: { clips: ["fac_pan_tree"], chips: [{ at: "financiering", text: "Ook bij de financiering", color: "green" }] },
    ligging: { clips: ["intersect_down", "drone_pan", "corner_bike"], chips: [{ at: "parkeerplaatsen", text: "2 eigen parkeerplaatsen", color: "green" }, { at: "a15", text: "A15", color: "navy" }, { at: "n218", text: "N218", color: "navy" }] },
    energie: { clips: ["terrace_office", "corner_right"], chips: [{ at: "gasloos", text: "Gasloos", color: "navy" }, { at: "energiezuinig", text: "Energiezuinig", color: "green" }, { at: "stroom", text: "Startklaar met stroom", color: "orange" }] },
    planning: { clips: ["construction", "drone_pullback"], chips: [{ at: "2027", text: "Oplevering 2027", color: "orange" }, { at: "vooruitplannen", text: "Nu vooruitplannen", color: "green" }] },
    cta: { clips: ["fac_straight_1", "corner_b", "fac_straight_2"] },
  },
  3: {
    intro: { clips: ["reception_2", "fac_straight_1"], chips: [{ at: "bedrijfsunit", text: "Eigen bedrijfsunit", color: "green" }, { at: "trots", text: "Klanten met trots ontvangen", color: "navy" }] },
    team: { clips: ["interior_build", "reception_1"], chips: [{ at: "persoonlijk", text: "Persoonlijke begeleiding", color: "green" }, { at: "vormgeven", text: "Vormgeven van je unit", color: "khaki" }] },
    design: { clips: ["corner_right", "terrace_office", "terrace_pan"], chips: [{ at: "strak", text: "Strak en modern ontwerp", color: "navy" }, { at: "edisonweg", text: "Edisonweg", color: "khaki" }, { at: "mallebos", text: "Vrij uitzicht over Mallebos", color: "green" }] },
    ligging: { clips: ["drone_pullback", "intersect_2", "harbor"], chips: [{ at: "a15", text: "A15", color: "navy" }, { at: "n218", text: "N218", color: "navy" }, { at: "rotterdam", text: "Rotterdam dichtbij", color: "orange" }, { at: "bushaltes", text: "Bushaltes op loopafstand", color: "green" }] },
    unit: { clips: ["push_in", "reception_1"], chips: [{ at: "88", text: "88 m²", color: "orange" }, { at: "lagen", text: "2 lagen", color: "navy" }, { at: "klanten", text: "Plek voor je klanten", color: "green" }] },
    parkeren: { clips: ["corner_bike", "fac_straight_2"], chips: [{ at: "parkeerplaatsen", text: "2 eigen parkeerplaatsen", color: "green" }] },
    prijs: { clips: ["corner_a", "construction"], chips: [{ at: "189500", text: "Vanaf € 189.500", color: "orange" }, { at: "2027", text: "Oplevering 2027", color: "navy" }] },
    cta: { clips: ["fac_straight_1", "corner_b", "fac_straight_2"] },
  },
};

export const HOOK_CLIPS: Record<number, Record<number, string[]>> = {
  1: { 1: ["fac_straight_1", "corner_b"], 2: ["reception_2", "push_in"], 3: ["corner_right", "fac_straight_2"], 4: ["corner_bike", "interior_build"], 5: ["push_in", "drone_pullback"] },
  2: { 1: ["van_unit", "van_unit_pan"], 2: ["van_unit_pan", "reception_1"], 3: ["corner_a", "intersect_down"], 4: ["fac_pan_tree", "corner_right"], 5: ["interior_build", "push_in"] },
  3: { 1: ["reception_2", "reception_1"], 2: ["fac_straight_1", "push_in"], 3: ["terrace_office", "terrace_pan"], 4: ["reception_1", "corner_bike"], 5: ["corner_bike", "corner_a"] },
};

export const HOOK_ACCENT: Record<number, Record<number, string[]>> = {
  1: { 1: ["pand", "jou"], 2: ["financiering"], 3: ["huur", "nooit"], 4: ["alleen"], 5: ["eigenaar"] },
  2: { 1: ["verspreid"], 2: ["uitvalsbasis"], 3: ["te", "klein"], 4: ["stootje"], 5: ["ruimte"] },
  3: { 1: ["keukentafel"], 2: ["professioneel"], 3: ["trots"], 4: ["plezier"], 5: ["eigen", "adres"] },
};

export const CTA_TEXT: Record<number, string> = { 1: "Vraag de documentatie aan", 2: "Vraag plattegronden aan", 3: "Vraag de brochure aan" };

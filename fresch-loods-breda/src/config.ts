// Welke clip bij welke hook en zin hoort. Een clip-lijst is [clip, startoffset in s, woord waarop geknipt wordt].
// gevel-entree-daglicht is afgekeurd (Veo voegt na ~1 s niet-bestaande architectuur toe) en wordt niet gebruikt.
// Alle clips: bronnen/ai-clips (Veo 3.1 vanuit staande uitsnedes van de projectrenders), harde knippen.
export type ClipRef = [string, number, string | null];

export const HOOK_CLIPS: Record<string, ClipRef[]> = {
  b1h1: [["hal-pallets-overheaddeur", 0, null]],
  b1h2: [["hal-stellingen-daklicht", 0, null]],
  b1h3: [["hal-stellingen-daklicht", 0, null]],
  b1h4: [["overheaddeur-bus-avond", 0, null]],
  b1h5: [["kantoorgevel-avond", 0, null]],
  b2h1: [["hal-pallets-overheaddeur", 0, null]],
  b2h2: [["hal-stellingen-daklicht", 0, null]],
  b2h3: [["overheaddeur-bus-avond", 0, null]],
  b2h4: [["kantoor-werkplekken-boven", 0, null]],
  b2h5: [["kantoorgevel-avond", 0, null]],
};

export const SCENE_CLIPS: Record<string, Record<string, ClipRef[]>> = {
  b1: {
    intro: [["gevel-hoek-daglicht", 0, null]],
    units: [["kantoorgevel-avond", 0, null]],
    collectie: [["hal-stellingen-daklicht", 1, null]],
    rekken: [["hal-pallets-overheaddeur", 1, null]],
    werkruimte: [["hal-stellingen-daklicht", 4, null]],
    vloer: [["hal-pallets-overheaddeur", 4, null], ["overheaddeur-bus-avond", 1, "overheaddeur"]],
    kantoor: [["kantoor-werkplekken-boven", 1, null]],
    parkeren: [["overheaddeur-bus-avond", 4, null]],
    turnkey: [["vergaderruimte-boven", 0, null]],
    cta: [["gevel-hoek-daglicht", 3, null]],
  },
  b2: {
    intro: [["gevel-hoek-daglicht", 0, null]],
    units: [["kantoorgevel-avond", 0, null]],
    groei: [["hal-stellingen-daklicht", 1, null]],
    verspreid: [["hal-pallets-overheaddeur", 1, null]],
    werkruimte: [["hal-stellingen-daklicht", 4, null]],
    vloer: [["hal-pallets-overheaddeur", 4, null]],
    laden: [["overheaddeur-bus-avond", 1, null]],
    kantoor: [["vergaderruimte-boven", 0, null]],
    parkeren: [["overheaddeur-bus-avond", 5, null]],
    twijfel: [["kantoor-werkplekken-boven", 1, null]],
    turnkey: [["gevel-hoek-daglicht", 3, null]],
    voorwaarden: [["vergaderruimte-boven", 4, null]],
    cta: [["kantoorgevel-avond", 3, null]],
  },
};

// Kleine tekstaccenten (weinig graphics): [zin, tekst]
export const ACCENTS: Record<string, [string, string][]> = {
  b1: [["units", "10 units · ruim 640 m²"], ["vloer", "1.000 kg/m²"], ["parkeren", "9 parkeerplaatsen per unit"], ["turnkey", "Turn-key · energielabel A"]],
  b2: [["units", "10 units · ruim 640 m²"], ["vloer", "1.000 kg/m²"], ["parkeren", "9 parkeerplaatsen per unit"], ["turnkey", "Turn-key · energielabel A"]],
};

export const ADRES = "Rudonk 10, Breda";

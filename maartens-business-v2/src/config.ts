// Per doelgroep (body): welke foto en welk geanimeerd beeld bij welke zin hoort.
// `at` = beginwoord (in de gesproken zin) waarop het element in beeld komt.
export type Stat = { to?: number; text?: string; prefix?: string; suffix?: string; label: string; at: string };
export type Line = { text: string; at: string; tone?: "red" | "white" | "ghost" };
export type Card = { title: string; sub?: string; at: string };
export type Spec = {
  photo: string;
  kind: "stat" | "big" | "split" | "blocks" | "cta";
  stats?: Stat[];
  lines?: Line[];
  cards?: Card[];
  arrow?: boolean;
  chip?: { text: string; at: string };
  blocks?: { done: number; total: number; at: string };
  cta?: { label: string; sub: string };
};

export const BODIES: Record<number, number> = { 1: 3, 2: 3, 3: 3 }; // aantal hooks per doelgroep

export const HOOK_PHOTO: Record<number, Record<number, string>> = {
  1: { 1: "voor", 2: "avond", 3: "lucht" },
  2: { 1: "gevel", 2: "terras", 3: "hoek" },
  3: { 1: "lucht", 2: "voor", 3: "avond" },
};

export const HOOK_ACCENT: Record<number, Record<number, string[]>> = {
  1: { 1: ["jezelf"], 2: ["eigen", "plek?"], 3: ["eigen", "pand", "A27?"] },
  2: { 1: ["niet", "gemaakt"], 2: ["één", "dak"], 3: ["strak", "hard", "werken?"] },
  3: { 1: ["niemand"], 2: ["eigen", "werkplaats"], 3: ["bedrijfsnaam", "A27?"] },
};

export const SCENES: Record<number, Record<string, Spec>> = {
  1: {
    intro: { photo: "voor", kind: "stat", stats: [
      { to: 300, prefix: "±", suffix: " m²", label: "eigen casco-bedrijfsunit", at: "circa" },
      { to: 2, label: "bouwlagen", at: "verdeeld" },
    ] },
    eigen: { photo: "gevel", kind: "big", lines: [
      { text: "NIET VAN EEN ANDER", at: "Geen", tone: "ghost" },
      { text: "VAN JOU.", at: "maar", tone: "red" },
    ] },
    indeling: { photo: "hoek", kind: "split", cards: [
      { title: "BENEDEN", sub: "Werkplaats · opslag · productie", at: "Beneden" },
      { title: "BOVEN", sub: "Jouw eigen kantoor", at: "boven" },
    ] },
    casco: { photo: "avond", kind: "big", lines: [
      { text: "CASCO", at: "casco", tone: "white" },
      { text: "OPGELEVERD", at: "wordt", tone: "white" },
      { text: "JIJ BEPAALT DE INDELING", at: "bepaal", tone: "red" },
    ] },
    terrein: { photo: "terras", kind: "stat", stats: [
      { to: 2, label: "eigen parkeerplaatsen", at: "twee" },
      { to: 12, prefix: "±", suffix: " m", label: "eigen achterterrein", at: "achterterrein" },
    ] },
    planning: { photo: "lucht", kind: "big", lines: [
      { text: "BOUW GESTART", at: "bouw", tone: "white" },
      { text: "OPLEVERING", at: "oplevering", tone: "ghost" },
      { text: "FEBRUARI 2027", at: "februari", tone: "red" },
    ] },
    animo: { photo: "voor", kind: "blocks", blocks: { done: 7, total: 11, at: "Zeven" }, chip: { text: "WACHT NIET TE LANG", at: "dus" } },
    cta: { photo: "avond", kind: "cta", cta: { label: "MELD JE AAN", sub: "Vrijblijvend gesprek" } },
  },
  2: {
    intro: { photo: "hoek", kind: "big", lines: [
      { text: "BETONNEN", at: "betonnen", tone: "white" },
      { text: "CASCO", at: "betonnen", tone: "red" },
      { text: "GEBOUWD VOOR STEVIG GEBRUIK", at: "gebouwd", tone: "ghost" },
    ] },
    vloer: { photo: "terras", kind: "stat", stats: [
      { to: 1000, suffix: " kg/m²", label: "begane grondvloer", at: "duizend" },
      { to: 500, suffix: " kg/m²", label: "verdiepingsvloer", at: "vijfhonderd" },
    ] },
    deuren: { photo: "gevel", kind: "split", arrow: true, cards: [
      { title: "VOORKANT", sub: "overheaddeur", at: "voor-" },
      { title: "ACHTERKANT", sub: "overheaddeur", at: "achterzijde" },
    ], chip: { text: "RIJ DWARS DOOR JE UNIT", at: "dwars" } },
    terrein: { photo: "terras", kind: "stat", stats: [
      { to: 12, prefix: "±", suffix: " m", label: "eigen achterterrein", at: "achterterrein" },
    ], chip: { text: "GEEN APARTE ACHTEROM", at: "aparte" } },
    parkeren: { photo: "voor", kind: "stat", stats: [
      { to: 2, label: "eigen parkeerplaatsen", at: "twee" },
    ], chip: { text: "LADEN & LOSSEN VOOR DE DEUR", at: "laadt" } },
    milieu: { photo: "avond", kind: "stat", stats: [
      { text: "3.1", label: "milieucategorie, tot en met", at: "milieucategorie" },
    ], chip: { text: "BEDRIJVEN TOEGESTAAN", at: "toegestaan." } },
    locatie: { photo: "lucht", kind: "stat", stats: [
      { text: "A27", label: "vlak bij", at: "A27" },
      { text: "N417", label: "directe verbinding", at: "N417" },
    ] },
    cta: { photo: "avond", kind: "cta", cta: { label: "MAAK EEN AFSPRAAK", sub: "Kijk of een unit past" } },
  },
  3: {
    zicht: { photo: "lucht", kind: "big", lines: [
      { text: "ZICHTLOCATIE", at: "zichtlocatie", tone: "red" },
      { text: "AAN DE A27", at: "aan", tone: "white" },
    ], chip: { text: "OOK ZICHTBAAR VANAF HET SPOOR", at: "spoor." } },
    rustig: { photo: "hoek", kind: "big", lines: [
      { text: "RUSTIG", at: "rustig", tone: "white" },
      { text: "INDUSTRIETERREIN", at: "industrieterrein", tone: "red" },
      { text: "WESTZIJDE MAARTENSDIJK", at: "westzijde", tone: "ghost" },
    ] },
    bereik: { photo: "lucht", kind: "stat", stats: [
      { text: "A27", label: "direct om de hoek", at: "A27" },
      { text: "N417", label: "directe verbinding", at: "N417" },
    ], chip: { text: "KLANTEN · PERSONEEL · LEVERANCIERS", at: "klanten," } },
    gevel: { photo: "gevel", kind: "big", lines: [
      { text: "BETONNEN GEVEL", at: "betonnen", tone: "white" },
      { text: "ZWARTE ACCENTEN", at: "zwarte", tone: "red" },
      { text: "STRAK & INDUSTRIEEL", at: "strakke,", tone: "ghost" },
    ] },
    binnen: { photo: "avond", kind: "stat", stats: [
      { to: 300, prefix: "±", suffix: " m²", label: "binnenruimte", at: "driehonderd" },
      { to: 2, label: "lagen, casco opgeleverd", at: "twee" },
    ], chip: { text: "JIJ BEPAALT DE INDELING", at: "indeling" } },
    prijs: { photo: "voor", kind: "stat", stats: [
      { to: 495000, prefix: "€ ", label: "vrij op naam, exclusief btw", at: "495.000" },
    ] },
    animo: { photo: "terras", kind: "blocks", blocks: { done: 7, total: 11, at: "Zeven" } },
    cta: { photo: "avond", kind: "cta", cta: { label: "BEKIJK DE PRIJSLIJST", sub: "Meld je aan voor jouw unit" } },
  },
};

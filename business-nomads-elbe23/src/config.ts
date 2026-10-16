// Welke clip waar: foto<nr> = Veo-clip (8 s, 1080x1920) van de gelijknamige projectfoto.
export type Callout = { word: string; big?: string; text: string; sub?: string };
export type SceneCfg = { clips: string[]; callouts?: Callout[] };

export const HOOKS: Record<string, { clip: string; label: string; accents: string[] }> = {
  b1h1: { clip: "foto10", label: "Van huren naar eigendom", accents: ["huur", "pand", "van", "jou", "is?"] },
  b1h2: { clip: "foto6", label: "Voor vakbedrijven", accents: ["te", "klein", "geworden", "team?"] },
  b1h3: { clip: "foto3", label: "Kantoor · showroom · opslag", accents: ["onder", "één", "dak"] },
  b1h4: { clip: "foto1", label: "Voor beleggers", accents: ["vastgoedportefeuille", "bedrijfsunit", "Den", "Haag?"] },
  b1h5: { clip: "foto8", label: "Voor foodondernemers", accents: ["foodbedrijf", "opslag", "overheaddeur?"] },
  b2h1: { clip: "foto5", label: "Van huren naar kopen", accents: ["huren", "kopen", "degelijk", "gebouwd", "is?"] },
  b2h2: { clip: "foto9", label: "Voor vakbedrijven", accents: ["stevig", "werkplaats", "aflevert?"] },
  b2h3: { clip: "foto7", label: "Representatief ondernemen", accents: ["kwaliteit", "klanten", "staat?"] },
  b2h4: { clip: "foto2", label: "Voor beleggers", accents: ["solide", "verduurzaming?", "portefeuille"] },
  b2h5: { clip: "foto4", label: "Voor foodondernemers", accents: ["foodbedrijf", "degelijk", "gebouwde"] },
  b3h1: { clip: "foto13", label: "Eigen pand, jouw indeling", accents: ["eigen", "pand", "bedrijf", "werkt?"] },
  b3h2: { clip: "foto11", label: "Werken én plannen", accents: ["beneden", "werkruimte", "boven", "administratie?"] },
  b3h3: { clip: "foto12", label: "Klanten beneden, rust boven", accents: ["klanten", "terras", "loggia", "erbij?"] },
  b3h4: { clip: "foto1", label: "Voor beleggers", accents: ["bedrijfsunit", "meerdere", "typen", "maten?"] },
  b3h5: { clip: "foto6", label: "Voor foodondernemers", accents: ["ruime", "begane", "grond", "overheaddeur"] },
};

export const BODIES: Record<string, Record<string, SceneCfg>> = {
  b1: {
    s1: { clips: ["foto3"], callouts: [{ word: "Forepark", text: "Elbe 23 · Forepark", sub: "Den Haag" }] },
    s2: { clips: ["foto1"], callouts: [{ word: "veertien", big: "14", text: "bedrijfsunits", sub: "±202 – ±230 m²" }] },
    s3: { clips: ["foto7", "foto5"], callouts: [{ word: "twee", text: "2 of 3 verdiepingen" }, { word: "werkplaats,", text: "Werkplaats · opslag", sub: "showroom · kantoor" }] },
    s4: { clips: ["foto6"], callouts: [{ word: "overheaddeur,", text: "Overheaddeur", sub: "goed laden en lossen" }] },
    s5: { clips: ["foto8"], callouts: [{ word: "twee", big: "2–3", text: "eigen parkeerplaatsen" }] },
    s6: { clips: ["foto2", "foto4"], callouts: [{ word: "A12", text: "A12 · A4", sub: "binnen enkele minuten" }, { word: "Rotterdam,", text: "Rotterdam · Leiden", sub: "Zoetermeer" }] },
    s7: { clips: ["foto13"], callouts: [{ word: "vierde", big: "Q4", text: "Oplevering 2027" }] },
    cta: { clips: ["foto12", "foto11"] },
  },
  b2: {
    s1: { clips: ["foto5"], callouts: [{ word: "kwaliteit", text: "Kwaliteit bovenaan", sub: "Nieuwbouw Forepark" }] },
    s2: { clips: ["foto6"], callouts: [{ word: "prefab", text: "Prefab beton + staal", sub: "betonnen verdiepingsvloeren" }] },
    s3: { clips: ["foto9", "foto7"], callouts: [{ word: "aluminium", text: "Aluminium kozijnen", sub: "HR++ glas" }, { word: "geïsoleerde", text: "Geïsoleerde", sub: "stalen sandwichpanelen" }] },
    s4: { clips: ["foto4"], callouts: [{ word: "verticale", text: "Verticale gevelbelijning" }] },
    s5: { clips: ["foto11"], callouts: [{ word: "vloerverwarmingsleidingen.", text: "Vloerverwarming", sub: "in de afwerkvloer" }] },
    s6: { clips: ["foto1", "foto2"], callouts: [{ word: "warmtepomp", text: "Warmtepomp + zonnepanelen", sub: "voorbereid in het casco" }, { word: "energielabel", text: "Voorbereid op A++++", sub: "in de praktijk" }] },
    s7: { clips: ["foto8", "foto10"], callouts: [{ word: "veertien", big: "14", text: "units", sub: "±202 – ±230 m²" }, { word: "twee", text: "2 of 3 eigen", sub: "parkeerplaatsen" }] },
    s8: { clips: ["foto13"], callouts: [{ word: "vierde", big: "Q4", text: "Oplevering 2027" }] },
    cta: { clips: ["foto12", "foto3"] },
  },
  b3: {
    s1: { clips: ["foto10", "foto4"], callouts: [{ word: "indeling", text: "Kies jouw indeling" }] },
    s2: { clips: ["foto7", "foto3"], callouts: [{ word: "1", text: "Units 1 t/m 7", sub: "±202 – 207 m² · 3 verdiepingen" }] },
    s3: { clips: ["foto11", "foto5"], callouts: [{ word: "terras", text: "Terras of loggia", sub: "±18 m²" }, { word: "twee", text: "2 eigen", sub: "parkeerplaatsen" }] },
    s4: { clips: ["foto9", "foto1"], callouts: [{ word: "8", text: "Units 8 t/m 14", sub: "±224 – 230 m² · 2 verdiepingen" }] },
    s5: { clips: ["foto8", "foto12"], callouts: [{ word: "begane", text: "Begane grond", sub: "±112 – 117 m²" }, { word: "drie", big: "3", text: "eigen parkeerplaatsen" }] },
    s6: { clips: ["foto6"], callouts: [{ word: "overheaddeur,", text: "Overheaddeur", sub: "units 2–6: ±4,4 m breed" }] },
    s7: { clips: ["foto13"], callouts: [{ word: "vierde", big: "Q4", text: "Oplevering 2027" }] },
    cta: { clips: ["foto2", "foto3"] },
  },
};

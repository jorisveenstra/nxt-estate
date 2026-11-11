// Welke clip bij welke zin, en welke accenten (chips, lagen, badges) erbij in beeld komen.
// Clips: 9:16 1080x1920, 8 s (public/clips). Herkomst: bronnen/generaties.json en bronnen/bibliotheek.json.

export type Accent =
  | { kind: "chips"; items: string[] }
  | { kind: "floors"; level: number | "all"; label: string; sub?: string }
  | { kind: "badges"; items: string[] }
  | { kind: "pin"; title: string; sub: string }
  | { kind: "stat"; pre: string; value: string; post: string };

export type Shot = { clip: string; accents: Accent[] };

const intro: Accent[] = [
  { kind: "stat", pre: "vanaf ±", value: "293 m²", post: "nieuwbouw-unit" },
  { kind: "floors", level: "all", label: "3 lagen" },
];

export const BODY: Record<string, { tag: string; cta: string; shots: Shot[] }> = {
  "1": {
    tag: "Voor architectenbureaus",
    cta: "Download de brochure",
    shots: [
      { clip: "hoek", accents: intro },
      { clip: "showroom", accents: [{ kind: "floors", level: 0, label: "Begane grond", sub: "Maquettes · monsters · archief" }] },
      { clip: "kantoor", accents: [{ kind: "floors", level: 1, label: "Representatief kantoor", sub: "Ontwerpen & ontvangen" }] },
      { clip: "trap", accents: [{ kind: "floors", level: 2, label: "Eigen dakterras", sub: "Pauze of klantgesprek buiten" }] },
      { clip: "studio", accents: [{ kind: "badges", items: ["Gasloos", "Luchtwarmtepomp", "Vloerverwarming", "Label A+++"] }] },
      { clip: "werkruimte", accents: [{ kind: "chips", items: ["Comfortabel werken", "Laag energieverbruik"] }] },
      { clip: "luchtfoto", accents: [{ kind: "pin", title: "Oudeweg · N200", sub: "Goed bereikbaar in Haarlem" }] },
      { clip: "gevel", accents: [{ kind: "chips", items: ["Turn-key opgeleverd", "Oplevering Q3 2026"] }] },
      { clip: "flex", accents: [] },
    ],
  },
  "2": {
    tag: "Voor creatieve bureaus",
    cta: "Schrijf je in",
    shots: [
      { clip: "hoek", accents: intro },
      { clip: "showroom", accents: [{ kind: "floors", level: 0, label: "Eigen studio", sub: "Foto · video · content" }] },
      { clip: "kantoor", accents: [{ kind: "floors", level: 1, label: "Representatief kantoor", sub: "Campagnes & pitches" }] },
      { clip: "trap", accents: [{ kind: "floors", level: 2, label: "Eigen dakterras", sub: "Teamsessies & vieren" }] },
      { clip: "luchtfoto", accents: [{ kind: "pin", title: "Oudeweg · N200", sub: "Bereikbaar én zichtbaar" }] },
      { clip: "studio", accents: [{ kind: "badges", items: ["Gasloos", "Luchtwarmtepomp", "Vloerverwarming", "Label A+++"] }] },
      { clip: "werkruimte", accents: [{ kind: "chips", items: ["Turn-key opgeleverd", "Oplevering Q3 2026"] }] },
      { clip: "gevel", accents: [] },
    ],
  },
  "3": {
    tag: "Voor interieurontwerpers",
    cta: "Bekijk de verhuurtekeningen",
    shots: [
      { clip: "gevel", accents: intro },
      { clip: "showroom", accents: [{ kind: "floors", level: 0, label: "Showroom", sub: "Stoffen · materialen · meubels" }] },
      { clip: "werkruimte", accents: [{ kind: "floors", level: 1, label: "Ontwerpstudio", sub: "Moodboards & tekeningen" }] },
      { clip: "trap", accents: [{ kind: "floors", level: 2, label: "Eigen dakterras", sub: "Koffie met je klant buiten" }] },
      { clip: "hoek", accents: [{ kind: "chips", items: ["Tussenunits", "+ 2 hoekunits"] }] },
      { clip: "studio", accents: [{ kind: "badges", items: ["Nieuwbouw", "Gasloos", "Label A+++"] }] },
      { clip: "kantoor", accents: [{ kind: "chips", items: ["Turn-key opgeleverd", "Oplevering Q3 2026"] }] },
      { clip: "flex", accents: [] },
    ],
  },
};

// Hookclip per body/hook (hard cut naar de eerste bodyclip, nooit dezelfde clip)
export const HOOK_CLIPS: Record<string, string[]> = {
  "1": ["luchtfoto", "flex", "studio", "kantoor", "werkruimte"],
  "2": ["luchtfoto", "flex", "studio", "kantoor", "werkruimte"],
  "3": ["showroom", "flex", "studio", "luchtfoto", "hoek"],
};

export const CLIP_SECONDS = 8;

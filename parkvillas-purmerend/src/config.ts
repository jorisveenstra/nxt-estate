// Per body: welke clip bij welke zin, en welke feitenlabels in beeld komen.
// Seg: [zin, woord-index binnen de zin waarop hard geknipt wordt, clip, startoffset in de clip (s)]
// Alle clips zijn Veo 3.1 image-to-video van de projectbeelden (public/clips, 1080x1920).
export type Seg = [number, number, string, number?];

export const HOOK_CLIP: Record<string, [string, number]> = {
  b1h1: ["achtergevel-terras", 0], b1h2: ["park-wandelpad", 0], b1h3: ["park-vijver", 0], b1h4: ["achtergevel-straat", 0], b1h5: ["woonkamer", 2],
  b2h1: ["park-vijver", 0], b2h2: ["park-wandelpad", 0], b2h3: ["loft-studio", 2], b2h4: ["stadstuin", 2], b2h5: ["woonkamer", 2],
  b3h1: ["keuken", 0], b3h2: ["loft-studio", 2], b3h3: ["woonkamer", 0], b3h4: ["achtergevel-straat", 0], b3h5: ["keuken", 2],
};

export const BODY_SEGS: Record<string, Seg[]> = {
  b1: [
    [0, 0, "voorgevel-park"], [1, 0, "park-wandelaars"], [2, 0, "achtergevel-terras"], [3, 0, "woonkamer"],
    [4, 0, "keuken"], [5, 0, "slaapkamer"], [5, 9, "loft-studio"], [6, 0, "achtergevel-straat"],
    [7, 0, "stadstuin"], [7, 13, "park-vijver"], [8, 0, "voorgevel-park"],
  ],
  b2: [
    [0, 0, "voorgevel-park"], [1, 0, "park-wandelaars"], [2, 0, "loft-studio"], [3, 0, "slaapkamer"],
    [4, 0, "woonkamer"], [5, 0, "achtergevel-terras"], [6, 0, "keuken"], [7, 0, "achtergevel-straat"],
    [8, 0, "stadstuin"], [8, 15, "voorgevel-park"],
  ],
  b3: [
    [0, 0, "voorgevel-park"], [2, 0, "loft-studio"], [3, 0, "achtergevel-terras"], [4, 0, "slaapkamer"],
    [5, 0, "stadstuin"], [6, 0, "woonkamer"], [7, 0, "achtergevel-straat"], [8, 0, "keuken"], [9, 0, "park-wandelaars"],
  ],
};

// Feitenlabels per zin (alleen feiten uit het projectdossier)
export const FACTS: Record<string, Record<number, string[]>> = {
  b1: {
    0: ["Park De Noord"], 2: ["± 137 m²", "5 kamers"], 3: ["6 m breed", "3 m hoog"], 4: ["Keuken: parkzijde of terraszijde"],
    5: ["Energielabel A+++", "Warmtepomp met zomerkoeling", "Zonnepanelen"], 6: ["2 parkeerplaatsen op eigen terrein", "Centrum & station op de fiets"],
    7: ["€ 639.000 – € 699.000 v.o.n.", "Oplevering gepland eind 2027"],
  },
  b2: {
    0: ["Park De Noord"], 1: ["Voortuin door tuinarchitect"], 2: ["Loft met eigen entree"], 3: ["Gastenverblijf", "Atelier"],
    4: ["1e verdieping", "Woonkamer 3 m hoog"], 5: ["3 slaapkamers", "2e verdieping"], 6: ["Energielabel A+++", "Zomerkoeling", "Vloerverwarming"],
    7: ["Centrum op enkele minuten fietsen"],
  },
  b3: {
    0: ["Park De Noord"], 1: ["Loft op de begane grond", "Eigen entree"], 2: ["Klanten via eigen ingang"], 3: ["Bedrijf aan huis toegestaan"],
    4: ["Kantoor", "Praktijk", "Atelier", "B&B"], 5: ["Stadstuin op het oosten"], 6: ["Woonkamer 3 m hoog"],
    7: ["2 parkeerplaatsen", "A7 dichtbij"], 8: ["± 137 m²", "Werkplek los van thuis"],
  },
};

export const CTA_TEXT = "Plan een afspraak met de makelaar";

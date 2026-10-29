// Welke clip bij welke zin hoort. Elke body heeft per zin één clip (de laatste is de CTA);
// een hook heeft zijn eigen openingsclip. Tussen de clips alleen harde sneden.
export type Chip = { zin: number; tekst: string };

export const BODIES: Record<number, { clips: string[]; chips: Chip[] }> = {
  1: {
    clips: ["luchtfoto-hoek", "facade-dag", "facade-goudenuur", "tuin-fiets", "tuin-zonnepanelen", "keuken-eiland", "woonkamer", "straat-gezin", "eetkamer-keuken"],
    chips: [
      { zin: 0, tekst: "12 nieuwbouwwoningen" },
      { zin: 1, tekst: "Ruim 111 m² · 3 slaapkamers + zolder" },
      { zin: 2, tekst: "Dakkapel · topgevel · 5e slaapkamer" },
      { zin: 3, tekst: "Eigen tuin · school en supermarkt in het dorp" },
      { zin: 4, tekst: "Aardgasvrij · zonnepanelen · A+++" },
      { zin: 5, tekst: "Betalen bij oplevering" },
      { zin: 6, tekst: "Totaaladvies van Vermeulen" },
      { zin: 7, tekst: "Oplevering Q1 2027" },
    ],
  },
  2: {
    clips: ["facade-dag", "tuin-zonnepanelen", "keuken-eiland", "woonkamer", "eetkamer-keuken", "straat-gezin", "luchtfoto-hoek", "facade-goudenuur", "tuin-fiets"],
    chips: [
      { zin: 0, tekst: "Vanaf € 289.000" },
      { zin: 1, tekst: "Aardgasvrij · HR++ · A+++" },
      { zin: 2, tekst: "Sanitair inbegrepen" },
      { zin: 3, tekst: "Betalen bij oplevering" },
      { zin: 4, tekst: "Hypotheekadvies van Vermeulen" },
      { zin: 5, tekst: "Vooraf duidelijkheid" },
      { zin: 6, tekst: "Terneuzen ± 15 min" },
      { zin: 7, tekst: "Oplevering Q1 2027" },
    ],
  },
  3: {
    clips: ["luchtfoto-hoek", "straat-gezin", "facade-dag", "facade-goudenuur", "tuin-zonnepanelen", "woonkamer", "eetkamer-keuken", "tuin-fiets"],
    chips: [
      { zin: 0, tekst: "12 woningen op de plek van De Ark" },
      { zin: 1, tekst: "In het hart van Sluiskil" },
      { zin: 2, tekst: "Supermarkt · huisarts · apotheek" },
      { zin: 3, tekst: "6 woningtypen" },
      { zin: 4, tekst: "Aardgasvrij · A+++" },
      { zin: 5, tekst: "Hulp bij verkoop van je huis" },
      { zin: 6, tekst: "Oplevering Q1 2027" },
    ],
  },
};

// Openingsclip per hook (body -> hook -> clip)
export const HOOK_CLIPS: Record<number, Record<number, string>> = {
  1: { 1: "woonkamer", 2: "tuin-fiets", 3: "facade-goudenuur", 4: "eetkamer-keuken", 5: "facade-dag" },
  2: { 1: "keuken-eiland", 2: "facade-goudenuur", 3: "tuin-zonnepanelen", 4: "straat-gezin", 5: "woonkamer" },
  3: { 1: "tuin-fiets", 2: "facade-goudenuur", 3: "woonkamer", 4: "facade-dag", 5: "tuin-zonnepanelen" },
};

// Woorden die in de ondertitel goud oplichten
export const ACCENT = /^(\d[\d.]*|€|A\+\+\+|twaalf|aardgasvrij|oplevering|voorfinanciering|tuin|zolder|zonnepanelen|Sluiskil|woningtypen|energielabel)/i;

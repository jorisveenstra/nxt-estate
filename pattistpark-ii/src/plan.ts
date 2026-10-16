// Montage-plan: welke clip (verifieerde 1080x1920 Veo-clip, zie ledger) bij welke zin/hook, plus grafische accenten.
export type Gfx = { icon: string; label: string; sub?: string };
export type Sentence = { clips: string[]; gfx?: Gfx; big?: string };
export type HookPlan = { clips: string[]; gfx: Gfx };

export const BODY: Record<number, Sentence[]> = {
  1: [
    { clips: ["08", "10"], gfx: { icon: "building", label: "PATTISTPARK", sub: "Nieuwbouw in Terneuzen" } },
    { clips: ["15", "13"], gfx: { icon: "floor", label: "GELIJKVLOERS", sub: "Alles op één verdieping" } },
    { clips: ["06", "05"], gfx: { icon: "pin", label: "VOORZIENINGEN", sub: "Dichtbij in de buurt" } },
    { clips: ["07", "11"], gfx: { icon: "coffee", label: "UITZICHT", sub: "Uw ochtendkoffie met zicht" } },
    { clips: ["11"], big: "Het mooiste?", gfx: { icon: "sparkle", label: "WOONGENOT" } },
    { clips: ["03", "04"], gfx: { icon: "pin", label: "TERNEUZEN", sub: "In de regio die u kent" } },
    { clips: ["13", "02"], gfx: { icon: "people", label: "MAKELAARS", sub: "Denken graag met u mee" } },
    { clips: ["00", "03"], gfx: { icon: "calendar", label: "OPLEVERING", sub: "Verwacht Q2 2027" } },
    { clips: ["10", "12"], gfx: { icon: "key", label: "NOG BESCHIKBAAR", sub: "Appartementen in Pattistpark" } },
    { clips: ["09", "12", "08"], gfx: { icon: "calendar", label: "PLAN EEN AFSPRAAK", sub: "Met de makelaar" } },
  ],
  2: [
    { clips: ["08", "10"], gfx: { icon: "building", label: "PATTISTPARK", sub: "Gelijkvloerse appartementen" } },
    { clips: ["05", "06"], gfx: { icon: "question", label: "WORDT MIJN HUIS VERKOCHT?" } },
    { clips: ["13", "02", "15"], gfx: { icon: "search", label: "VERKOOPBAARHEID", sub: "Inzicht van de makelaars" } },
    { clips: ["15"], gfx: { icon: "euro", label: "LEENCAPACITEIT", sub: "Inzicht vooraf" } },
    { clips: ["02", "12"], gfx: { icon: "check", label: "DUIDELIJKHEID", sub: "U weet waar u staat" } },
    { clips: ["00", "03", "04"], gfx: { icon: "calendar", label: "OPLEVERING", sub: "Verwacht Q2 2027 · tijd om voor te bereiden" } },
    { clips: ["15", "07", "11"], gfx: { icon: "floor", label: "ÉÉN VERDIEPING", sub: "Uitzicht · voorzieningen dichtbij" } },
    { clips: ["09", "12", "10"], gfx: { icon: "calendar", label: "PLAN EEN AFSPRAAK", sub: "Bespreek uw situatie" } },
  ],
};

export const HOOKS: Record<string, HookPlan> = {
  "1-1": { clips: ["05", "06"], gfx: { icon: "home", label: "TE GROOT?", sub: "Kinderen uit huis" } },
  "1-2": { clips: ["15", "05"], gfx: { icon: "floor", label: "ZELFSTANDIG WONEN", sub: "Alles op één verdieping" } },
  "1-3": { clips: ["07", "11"], gfx: { icon: "eye", label: "UITZICHT", sub: "Elke dag genieten" } },
  "1-4": { clips: ["13", "15"], gfx: { icon: "floor", label: "GELIJKVLOERS", sub: "Is die stap haalbaar?" } },
  "1-5": { clips: ["04", "03"], gfx: { icon: "pin", label: "NAAR TERNEUZEN", sub: "Dichter bij voorzieningen" } },
  "2-1": { clips: ["05", "13"], gfx: { icon: "question", label: "VERKOOP HUIDIG HUIS?", sub: "Gelijkvloers wonen" } },
  "2-2": { clips: ["15", "13"], gfx: { icon: "key", label: "MAKKELIJKER WONEN", sub: "Zonder gedoe" } },
  "2-3": { clips: ["07", "11"], gfx: { icon: "eye", label: "WONEN MET UITZICHT", sub: "Past het bij u?" } },
  "2-4": { clips: ["10", "08"], gfx: { icon: "euro", label: "FINANCIEREN?", sub: "Twijfelt u?" } },
  "2-5": { clips: ["04", "06"], gfx: { icon: "pin", label: "VAN DORP NAAR TERNEUZEN", sub: "Waar begint u?" } },
};

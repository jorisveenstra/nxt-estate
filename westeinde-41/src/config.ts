// Welke clips (public/clips/<naam>.mp4, native 1080x1920, 8 s) bij welke zin/hook, en welke accenten in beeld.
// Notatie "naam@s": clip vanaf seconde s (zelfde clip, ander deel = andere camerapositie).
// Huisclips zijn geanimeerde staande uitsneden van de officiële renders (Veo 3.1 beeld-naar-video);
// polder-weiland is een AI-sfeerbeeld (tekst-naar-video) van een Noord-Hollandse polder, niet de woning.
// achtergevel-boot is afgekeurd (camera schuift naar verzonnen buurpanden/dakramen) en wordt niet gebruikt.
// Overige omgevingsclips konden niet gemaakt worden: ElevenLabs-tegoed op (zie bron/generaties.json).

export type IconName = "huis" | "water" | "boot" | "keuken" | "laptop" | "bed" | "parkeren" | "winkel" | "check" | "kalender" | "zolder" | "tuin" | "plattegrond" | "polder";
export type Accent = { icon: IconName; value: string; label: string };
export type Zin = { clips: string[]; accent?: Accent };
export type Body = { zinnen: Zin[] };
export type Hook = { clips: string[]; kicker: string };

export const BODIES: Record<string, Body> = {
  b1: {
    zinnen: [
      { clips: ["voorgevel-voordeur@0.3", "polder-weiland@0.3"], accent: { icon: "polder", value: "Vrij uitzicht", label: "over polder de Zeevang" } },
      { clips: ["achtergevel-terras@0.3"], accent: { icon: "boot", value: "Tuin aan vaarwater", label: "boot aanleggen bij het perceel" } },
      { clips: ["woonkamer-ramen@0.3", "keuken-kookeiland@0.3"], accent: { icon: "keuken", value: "Woonkeuken", label: "met kookeiland als middelpunt" } },
      { clips: ["woonkamer-kast@0.3"], accent: { icon: "laptop", value: "Kantoor + berging", label: "naast de living" } },
      { clips: [] },
      { clips: ["woonkamer-ramen@4"], accent: { icon: "bed", value: "Optioneel", label: "slaapkamer + douche op de begane grond" } },
      { clips: ["voorgevel-rechts@0.3", "polder-weiland@4"], accent: { icon: "parkeren", value: "2 eigen parkeerplaatsen", label: "en de voorzieningen in het dorp" } },
      { clips: ["voorgevel-voordeur@3.2"], accent: { icon: "check", value: "Vergunning verleend", label: "oplevering verwacht Q1 2028" } },
      { clips: ["achtergevel-terras@3.5", "voorgevel-rechts@3.5"] },
    ],
  },
  b2: {
    zinnen: [
      { clips: ["voorgevel-voordeur@0.3", "polder-weiland@0.3", "voorgevel-rechts@0.3"], accent: { icon: "huis", value: "ca. 174 m²", label: "één gezinswoning, geen groot project" } },
      { clips: ["keuken-kookeiland@0.3", "woonkamer-kast@0.3"], accent: { icon: "keuken", value: "Woonkeuken", label: "met kookeiland en grote eettafel" } },
      { clips: ["voorgevel-rechts@4"], accent: { icon: "bed", value: "3 slaapkamers", label: "badkamer en inloopkast" } },
      { clips: ["voorgevel-voordeur@3"] },
      { clips: [], accent: { icon: "zolder", value: "Zolder", label: "speelkamer of chillruimte" } },
      { clips: ["woonkamer-ramen@0.3"], accent: { icon: "laptop", value: "Apart kantoor", label: "rustig thuiswerken" } },
      { clips: ["achtergevel-terras@0.3"], accent: { icon: "tuin", value: "ca. 13 m brede tuin", label: "aan vaarbaar water" } },
      { clips: ["polder-weiland@4"], accent: { icon: "parkeren", value: "2 eigen parkeerplaatsen", label: "bakker, supermarkt en markt in het dorp" } },
      { clips: ["woonkamer-ramen@4"], accent: { icon: "check", value: "Vergunning verleend", label: "oplevering verwacht Q1 2028" } },
      { clips: ["achtergevel-terras@3.5", "voorgevel-voordeur@3"] },
    ],
  },
  b3: {
    zinnen: [
      { clips: ["voorgevel-voordeur@0.3", "achtergevel-terras@4"], accent: { icon: "huis", value: "Westeinde 41", label: "tussen polder en vaarwater" } },
      { clips: ["polder-weiland@0.3"], accent: { icon: "polder", value: "Vrij uitzicht", label: "over polder de Zeevang" } },
      { clips: ["achtergevel-terras@0.3"], accent: { icon: "boot", value: "Tuin op het westen", label: "aan vaarbaar water" } },
      { clips: ["keuken-kookeiland@0.3", "woonkamer-ramen@0.3"], accent: { icon: "huis", value: "ca. 174 m²", label: "woonkeuken + living met dubbel uitzicht" } },
      { clips: ["woonkamer-kast@0.3"] },
      { clips: [], accent: { icon: "laptop", value: "Apart kantoor", label: "voor thuiswerkdagen" } },
      { clips: ["voorgevel-rechts@0.3", "polder-weiland@4"], accent: { icon: "winkel", value: "Alles in het dorp", label: "bakker, slager, Plus en vrijdagmarkt" } },
      { clips: ["keuken-kookeiland@4"], accent: { icon: "plattegrond", value: "Kopen van tekening", label: "plattegronden en tekeningen" } },
      { clips: ["voorgevel-rechts@4"], accent: { icon: "check", value: "Vergunning verleend", label: "oplevering verwacht Q1 2028" } },
      { clips: ["achtergevel-terras@2.5", "voorgevel-voordeur@3"] },
    ],
  },
};

// clips: [] = de vorige shot loopt door (één doorlopende shot over meerdere zinnen).

export const HOOKS: Record<string, Hook[]> = {
  b1: [
    { clips: ["polder-weiland@4"], kicker: "Wonen aan het water" },
    { clips: ["woonkamer-ramen@0.3"], kicker: "Comfortabel nieuw wonen" },
    { clips: ["polder-weiland@0.3", "achtergevel-terras@4"], kicker: "Polder & vaarwater" },
    { clips: ["achtergevel-terras@0.3"], kicker: "Uw volgende levensfase" },
    { clips: ["voorgevel-rechts@0.3"], kicker: "Nieuw aan het Westeinde" },
  ],
  b2: [
    { clips: ["achtergevel-terras@0.3"], kicker: "Ruimte voor jullie gezin" },
    { clips: ["voorgevel-voordeur@0.3", "woonkamer-ramen@0.3", "achtergevel-terras@4"], kicker: "Wonen in Oosthuizen" },
    { clips: ["polder-weiland@0.3"], kicker: "Geen groot project" },
    { clips: ["woonkamer-kast@0.3"], kicker: "ca. 174 m² gezinswoning" },
    { clips: ["keuken-kookeiland@0.3"], kicker: "Samen rond het kookeiland" },
  ],
  b3: [
    { clips: ["polder-weiland@0.3"], kicker: "Van de stad naar het water" },
    { clips: ["woonkamer-ramen@0.3"], kicker: "Landelijk én thuiswerken" },
    { clips: ["achtergevel-terras@0.3"], kicker: "Je boot aan je eigen perceel" },
    { clips: ["polder-weiland@4", "achtergevel-terras@4"], kicker: "Polder & vaarwater" },
    { clips: ["voorgevel-rechts@0.3"], kicker: "Meer rust, echt dorps" },
  ],
};

export const PAUZE = 0.45; // seconden stilte na de hook
export const STAART = 1.0; // seconden na het laatste woord van de CTA
export const FPS = 30;

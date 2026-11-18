// Welke clips (public/clips/<naam>.mp4, native 1080x1920, 8 s) bij welke zin/hook, en welke accenten in beeld.
// Notatie "naam@s": clip vanaf seconde s (zelfde clip, ander deel = andere camerapositie).
// Alle clips zijn Veo 3.1 beeld-naar-video-animaties (ElevenLabs Image & Video) van architectuurgetrouwe staande
// uitsneden uit de projectbronnen: achtergevel-render, omgevingsfoto ringvaart/Het Twiske, keuken- en woonkamerrender.
// Bruikbare clipdelen zijn begrensd in Video.tsx (MAX_EIND).
// Grafiekniveau "weinig": korte, kleine feitelijke accenten; beeld blijft full-bleed en dominant. Alleen harde cuts.

export type IconName = "huis" | "water" | "boot" | "keuken" | "bed" | "parkeren" | "check" | "kalender" | "tuin" | "energie" | "auto" | "euro" | "polder";
export type Accent = { icon: IconName; value: string; label: string };
export type Zin = { clips: string[]; accent?: Accent };
export type Body = { zinnen: Zin[] };
export type Hook = { clips: string[]; kicker: string };

const PRIJS: Accent = { icon: "euro", value: "€ 1.295.000", label: "vrij op naam" };
const VERGUNNING: Accent = { icon: "check", value: "Vergunning verleend", label: "bouw start direct na koop" };
const SLAAP: Accent = { icon: "bed", value: "4 slaapkamers", label: "2 badkamers + inloopkast" };
const ENERGIE: Accent = { icon: "energie", value: "Energielabel A+++", label: "warmtepomp + vloerverwarming" };

export const BODIES: Record<string, Body> = {
  b1: {
    zinnen: [
      { clips: ["achtergevel-woning@0.3", "ringvaart-twiske@0.3"], accent: { icon: "huis", value: "Apollolaan 48a", label: "vrijstaand, direct aan de ringvaart" } },
      { clips: ["achtergevel-boot@0.3"], accent: { icon: "boot", value: "Boot voor de deur", label: "afmeren aan de ringvaart" } },
      { clips: ["ringvaart-twiske@3"] },
      { clips: ["woonkamer-tuindeuren@0.3"] },
      { clips: ["keuken-kookeiland@0.3", "achtergevel-terras@0.3"], accent: { icon: "tuin", value: "Perceel 319 m²", label: "leefverdieping met tuin" } },
      { clips: ["woonkamer-eethoek@0.3"], accent: SLAAP },
      { clips: ["achtergevel-woning@2.5"], accent: VERGUNNING },
      { clips: ["achtergevel-boot@2.5"], accent: PRIJS },
      { clips: ["achtergevel-terras@1.5", "ringvaart-twiske@4.5"] },
    ],
  },
  b2: {
    zinnen: [
      { clips: ["achtergevel-woning@0.3"], accent: { icon: "huis", value: "Eén woning", label: "vrijstaande nieuwbouw van DJZN" } },
      { clips: ["achtergevel-terras@0.3", "keuken-eettafel@0.3"], accent: { icon: "check", value: "Vergunning verleend", label: "bouwtijd één jaar" } },
      { clips: ["woonkamer-tuindeuren@0.3"], accent: ENERGIE },
      { clips: ["achtergevel-boot@0.3", "achtergevel-woning@2.5"], accent: { icon: "parkeren", value: "Perceel 319 m²", label: "3 auto's + garage 18 m²" } },
      { clips: ["keuken-kookeiland@0.3", "woonkamer-eethoek@0.3"], accent: { icon: "bed", value: "157 m² wonen", label: "4 slaapkamers, 2 badkamers" } },
      { clips: ["ringvaart-twiske@0.3", "achtergevel-terras@2"], accent: { icon: "auto", value: "ca. 20 minuten", label: "naar Amsterdam-Centrum" } },
      { clips: ["keuken-eettafel@2"] },
      { clips: ["achtergevel-boot@2.5"], accent: PRIJS },
      { clips: ["achtergevel-woning@2", "ringvaart-twiske@4.5"] },
    ],
  },
  b3: {
    zinnen: [
      { clips: ["ringvaart-twiske@0.3", "achtergevel-woning@0.3"], accent: { icon: "water", value: "Aan de ringvaart", label: "Het Twiske direct achter het huis" } },
      { clips: ["achtergevel-terras@0.3"] },
      { clips: ["achtergevel-boot@0.3"], accent: { icon: "parkeren", value: "Perceel 319 m²", label: "3 auto's + vrijstaande garage" } },
      { clips: ["keuken-kookeiland@0.3", "keuken-eettafel@0.3"] },
      { clips: ["woonkamer-eethoek@0.3"], accent: SLAAP },
      { clips: ["woonkamer-tuindeuren@0.3"], accent: ENERGIE },
      { clips: ["achtergevel-woning@2.5"], accent: { icon: "check", value: "Vergunning verleend", label: "bouwtijd één jaar" } },
      { clips: ["ringvaart-twiske@4"] },
      { clips: ["achtergevel-terras@2"], accent: PRIJS },
      { clips: ["achtergevel-boot@2", "achtergevel-woning@2"] },
    ],
  },
};

// clips: [] = de vorige shot loopt door (één doorlopende shot over meerdere zinnen).
// De laatste hookshot verschilt steeds van de eerste bodyshot, zodat de harde cut geen jump cut wordt.

export const HOOKS: Record<string, Hook[]> = {
  b1: [
    { clips: ["achtergevel-boot@0.3"], kicker: "Boot voor de deur" },
    { clips: ["achtergevel-woning@2.5", "ringvaart-twiske@0.3"], kicker: "Water & Het Twiske" },
    { clips: ["woonkamer-tuindeuren@0.3"], kicker: "Vrij uitzicht" },
    { clips: ["ringvaart-twiske@3"], kicker: "Varen vanaf huis" },
    { clips: ["achtergevel-terras@0.3"], kicker: "Nieuw aan de ringvaart" },
  ],
  b2: [
    { clips: ["achtergevel-terras@0.3"], kicker: "Vergunning al rond" },
    { clips: ["woonkamer-tuindeuren@0.3", "ringvaart-twiske@0.3"], kicker: "Energielabel A+++" },
    { clips: ["achtergevel-boot@0.3"], kicker: "Dicht bij Amsterdam" },
    { clips: ["keuken-kookeiland@0.3", "achtergevel-terras@1.5"], kicker: "Lage energielasten" },
  ],
  b3: [
    { clips: ["ringvaart-twiske@0.3", "achtergevel-woning@0.3"], kicker: "Vrijstaand in de Zaanstreek" },
    { clips: ["achtergevel-woning@0.3", "achtergevel-terras@0.3"], kicker: "De stap naar vrijstaand" },
    { clips: ["ringvaart-twiske@3", "achtergevel-woning@2.5"], kicker: "Naast Het Twiske" },
    { clips: ["achtergevel-boot@0.3"], kicker: "Wonen aan het water" },
    { clips: ["achtergevel-terras@0.3"], kicker: "Eén woning aan de ringvaart" },
  ],
};

export const PAUZE = 0.45; // seconden stilte na de hook
export const STAART = 1.0; // seconden na het laatste woord van de CTA
export const FPS = 30;

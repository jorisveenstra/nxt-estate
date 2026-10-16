// Clips (AI-animatie van de aangeleverde foto's, Veo 3.1, 1080x1920) per scène; scène 0 t/m 6 = zinnen, 7 = CTA.
export const BODY_CLIPS: Record<string, string[][]> = {
  b1: [["HBC_Spaarne_kant-4"], ["Onder_het_dek"], ["g33"], ["h26-1"], ["j19"], ["j38"], ["Punt_closeup", "HBC_Waarderweg"], ["HBC_entree_close_up"]],
  b2: [["Units_met_glazen_gevel_gecombineerd"], ["Units_standaard_met_glazen_overhead_deur"], ["h26-10"], ["HBC_entree_close_up", "h26-1"], ["j38", "j38-3"], ["h7", "h26-2"], ["HBC_punt_orgineel"], ["HBC_Waarderweg"]],
  b3: [["HBC_Spaarne_kant-4"], ["HBC_Waarderweg", "Punt_closeup"], ["g33", "Units_met_glazen_gevel_gecombineerd"], ["j19"], ["Units_standaard_met_glazen_overhead_deur"], ["Onder_het_dek", "h7"], ["j38"], ["HBC_entree_close_up"]],
};

export const HOOK_CLIP: Record<string, string[]> = {
  b1: ["Units_met_glazen_gevel_gecombineerd", "h7", "Units_standaard_met_glazen_overhead_deur", "h26-10", "j38-3"],
  b2: ["j19", "HBC_Spaarne_kant-4", "Punt_closeup", "Onder_het_dek", "g33"],
  b3: ["h26-1", "h26-10", "h26-2", "HBC_punt_orgineel", "j38-3"],
};

export const AUDIENCE = ["Creatieve bureaus", "Tech & data", "Interieur & showroom", "Zelfstandig adviseurs", "Meer uitstraling"];

type Callout = { t: string; s?: string } | null;
export const CALLOUTS: Record<string, Callout[]> = {
  b1: [
    { t: "4e verdieping", s: "direct aan Het Spaarne" },
    { t: "Eigen voordeur", s: "plafonds van 3 meter hoog" },
    { t: "Uitzicht", s: "over het water en Haarlem" },
    { t: "Flexibele metrages", s: "kies de ruimte voor je team" },
    { t: "Lunchroom + dakterras", s: "lunch · klantafspraak · borrel" },
    { t: "Ondernemers als buren", s: "van mediabureau tot designstudio" },
    { t: "±1 km", s: "van het centrum van Haarlem" },
    null,
  ],
  b2: [
    { t: "Unit met glazen gevel", s: "industrieel pand aan Het Spaarne" },
    { t: "±120 m²", s: "verdeeld over twee verdiepingen" },
    { t: "Vol daglicht", s: "ontvang klanten achter glas" },
    { t: "148 parkeerplaatsen", s: "met laadpunten voor elektrische auto's" },
    { t: "Warmtepomp + HR++-glas", s: "standaard uitgevoerd" },
    { t: "A9 · A5 · A2 · A10", s: "Schiphol op 15 km" },
    { t: "Een adres met trots", s: "voor klanten en personeel" },
    null,
  ],
  b3: [
    { t: "Verhuurunits", s: "ruimte voor 126 bedrijven · aan Het Spaarne" },
    { t: "Al gevestigd", s: "media · keuken · data" },
    { t: "Kies jouw verhuurunit", s: "4e verdieping of glazen gevel" },
    { t: "Lunchroom", s: "binnen- en buitenterras" },
    { t: "Zakelijke bijeenkomsten", s: "klein of groot" },
    { t: "24/7 camerabewaking", s: "verwarmde hellingbaan · goederenlift" },
    { t: "Groei samen", s: "tussen ondernemers die elkaar versterken" },
    null,
  ],
};

export const CTA_TEXT: Record<string, string> = { b1: "Plan een bezichtiging", b2: "Vraag alle informatie aan", b3: "Plan een afspraak op locatie" };

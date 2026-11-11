// Shotlijsten. 'v-*' = originele video (staand uitgesneden), 'r-*' = echte foto -> Veo-beweging, 'a-*' = impressie -> Veo-beweging.
export const BODY_SHOTS: Record<number, string[]> = {
  // Revisie: zin "grote woning van ca. 225 m², veel slaapkamers" toegevoegd (ruim interieurbeeld r-open).
  // Geen dezelfde clip aan beide kanten van de harde cut hook -> body.
  1: ["v-hal", "a-woonkamer", "r-raam", "r-voorgevel", "r-open", "v-ext", "v-stair", "a-atelier", "r-terras", "v-raam", "r-voordeur"],
  2: ["v-hal", "a-naaien", "r-voorgevel", "r-open", "a-woonkamer", "a-atelier", "r-raam", "v-raam", "v-stair", "r-voordeur"],
  3: ["v-ext", "a-kinderkamer", "r-voorgevel", "r-open", "v-stair", "v-bal", "a-kinderkamer", "r-terras", "a-terras", "v-raam", "r-voordeur"],
};
export const HOOK_SHOTS: Record<number, string[]> = {
  1: ["a-atelier", "r-voorgevel", "a-woonkamer", "r-open", "r-terras"],
  2: ["a-naaien", "v-ext", "a-atelier", "r-raam", "a-terras"],
  3: ["r-voordeur", "a-kinderkamer", "r-terras", "a-woonkamer", "r-voorgevel"],
};
// Korte accenten per zin (index in body + CTA). "M2" = geanimeerde oppervlakte-accent (ca. 225 m², veel slaapkamers).
export const CALLOUTS: Record<number, Record<number, string>> = {
  1: { 0: "Jouw vakblik", 1: "Daglicht · maat · verhouding", 2: "Jouw werkplek", 3: "Koer · Rotterdam", 4: "M2", 6: "Per ruimte · per raam · per meter", 7: "Welke kamer wordt jouw studio?", 8: "Indeling · afwerking · prijs" },
  2: { 0: "Wonen én maken", 1: "Ezel · werkbank · materiaal", 2: "Koer · Rotterdam", 3: "M2", 4: "Door de ogen van een maker", 5: "Jouw atelier?", 6: "Genoeg daglicht?", 7: "Vraag het de makelaar" },
  3: { 0: "Een huis dat meegroeit", 1: "Een eigen kamer per kind", 2: "Koer · Rotterdam", 3: "M2", 4: "Door de ogen van jullie gezin", 5: "Kinderkamer en speelhoek", 6: "Buitenruimte en buurt", 7: "Indeling · buurt · prijs" },
};

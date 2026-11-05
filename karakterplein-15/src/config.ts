// Shotlijsten. 'v-*' = originele video (staand uitgesneden), 'r-*' = echte foto -> Veo-beweging, 'a-*' = impressie -> Veo-beweging.
export const BODY_SHOTS: Record<number, string[]> = {
  1: ["v-hal", "a-woonkamer", "r-raam", "v-stair", "a-atelier", "r-open", "r-terras", "a-terras", "v-raam", "r-voordeur"],
  2: ["a-naaien", "a-atelier", "r-voorgevel", "a-woonkamer", "r-open", "r-raam", "v-raam", "a-naaien", "r-voordeur"],
  3: ["r-voorgevel", "a-kinderkamer", "a-terras", "r-terras", "a-kinderkamer", "v-bal", "a-woonkamer", "r-open", "r-voordeur"],
};
export const HOOK_SHOTS: Record<number, string[]> = {
  1: ["a-atelier", "r-voorgevel", "a-woonkamer", "r-open", "r-terras"],
  2: ["a-naaien", "v-ext", "a-atelier", "r-raam", "a-terras"],
  3: ["r-voordeur", "a-kinderkamer", "r-terras", "a-woonkamer", "r-voorgevel"],
};
// Korte accenten per zin (index in body + CTA)
export const CALLOUTS: Record<number, Record<number, string>> = {
  1: { 0: "Jouw vakblik", 1: "Daglicht · maat · verhouding", 2: "Jouw werkplek", 3: "Koer · Rotterdam", 5: "Per ruimte · per raam · per meter", 6: "Welke kamer wordt jouw studio?", 7: "Indeling · afwerking · prijs" },
  2: { 0: "Wonen én maken", 1: "Ezel · werkbank · materiaal", 2: "Koer · Rotterdam", 3: "Door de ogen van een maker", 4: "Jouw atelier?", 5: "Genoeg daglicht?", 6: "Vraag het de makelaar" },
  3: { 0: "Een huis dat meegroeit", 1: "Een eigen kamer per kind", 2: "Koer · Rotterdam", 3: "Door de ogen van jullie gezin", 4: "Kinderkamer en speelhoek", 5: "Buitenruimte en buurt", 6: "Indeling · buurt · prijs" },
};

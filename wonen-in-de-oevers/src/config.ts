// Clips (Veo 3.1, native 1080x1920) uitsluitend uit de vier tussenwoning-renders in de hoofdmap van de bronnenbibliotheek:
// TR1 lichte puntgevel + bakfiets, TR2 rij voordeuren en hagen, TL1 tilt van bloemen naar puntgevel, TL2 over het water naar de rij,
// TL3 zijwaarts langs de rechter puntgevel, TU1 kraanbeweging van kanaal naar bakstenen kopgevel, TU2 kanaal met zwanen,
// TI1 woonkamer met bank, TI2 eethoek en keuken. Elke clip is 8 s; scènes langer dan ~7,5 s krijgen twee clips (harde knip).
export const HOOK_CLIPS: Record<string, string[]> = {
  b1h1: ["TI1"], b1h2: ["TR1"], b1h3: ["TL1"], b1h4: ["TU1"], b1h5: ["TR2"],
  b2h1: ["TL2"], b2h2: ["TU1"], b2h3: ["TI2"], b2h4: ["TL3"], b2h5: ["TI1"],
  b3h1: ["TR1"], b3h2: ["TL1"], b3h3: ["TL2", "TU1"], b3h4: ["TL3"], b3h5: ["TR2"],
};
export const SCENE_CLIPS: Record<string, Record<string, string[]>> = {
  b1: { z0: ["TU2"], z1: ["TR2"], z2: ["TL1"], z3: ["TI1"], z4: ["TL2", "TU1"], z5: ["TR1"], z6: ["TI2"], z7: ["TL3", "TR2"], cta: ["TU1", "TL1"] },
  b2: { z0: ["TU2"], z1: ["TR2"], z2: ["TI1"], z3: ["TI2"], z4: ["TL1"], z5: ["TL2"], z6: ["TU1", "TL3"], cta: ["TR1", "TU2"] },
  b3: { z0: ["TU2"], z1: ["TR2"], z2: ["TI1", "TI2"], z3: ["TL2", "TU1"], z4: ["TL1"], z5: ["TR1", "TL3"], z6: ["TR2", "TL2"], cta: ["TU1", "TL1"] },
};
// Korte feitelijke accenten (alleen specificaties van de vier beschikbare tussenwoningen: bouwnummers 16, 31, 33 en 39)
const PRIJS: [string, string] = ["Vanaf €592.500", "Oplevering verwacht 1e helft 2028"];
const VIER: [string, string] = ["Nog maar 4 tussenwoningen", "Bouwnummers 16 · 31 · 33 · 39"];
export const CHIPS: Record<string, Record<string, [string, string]>> = {
  b1: { z0: ["Wilgenrijk, Maassluis", "Kleinschalig op een schiereiland"], z1: VIER, z2: ["129 m² woonruimte", "3 woonlagen · 5 slaapkamers"],
        z3: ["Kinderkamer · logeerplek · werkplek", ""], z4: ["Ruime percelen 155–172 m²", "Park, water en speelnatuur vlakbij"], z5: ["Basisschool op ±5 min lopen", ""],
        z6: ["Gasloos", "Vloerverwarming · aardwarmtepomp in de prijs"], z7: PRIJS },
  b2: { z0: ["Wilgenrijk, Maassluis", "Kleinschalig op een schiereiland"], z1: VIER, z2: ["Meteen gasloos", "Vloerverwarming · aardwarmtepomp"],
        z3: ["Aardwarmtepomp standaard", "Inbegrepen in de prijs"], z4: ["129 m² · 5 slaapkamers", "3 woonlagen"], z5: ["Ruime percelen 155–172 m²", "Park en water dichtbij"], z6: PRIJS },
  b3: { z0: ["Wilgenrijk, Maassluis", "Groen en waterrijk"], z1: VIER, z2: ["129 m² woonruimte", "3 woonlagen · 5 slaapkamers"],
        z3: ["Percelen 155–172 m²", "Park en water dichtbij"], z4: ["Gasloos & comfortabel", "Aardwarmtepomp in de prijs"],
        z5: ["Metro ±10 min lopen", "Rotterdam ±30 min met OV"], z6: PRIJS },
};
export const CTA_BUTTON: Record<string, string> = { b1: "Doe de financiële check", b2: "Plan een afspraak", b3: "Plan een afspraak" };

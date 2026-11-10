// Clips: A voorgevel, B rij langs water, C hoekwoning, D tuin/haag, E woonkamer gezin, F woonkamer/keuken, G woonkamer tuindeuren,
// H waterzijde met pergola, I achtertuinen aan water, J luchtbeeld buurt, L bloemen en gevel. Alles Veo 3.1, native 1080x1920.
export const HOOK_CLIPS: Record<string, string[]> = {
  b1h1: ["E"], b1h2: ["A"], b1h3: ["C"], b1h4: ["B", "L"], b1h5: ["L"],
  b2h1: ["D"], b2h2: ["B"], b2h3: ["C"], b2h4: ["G"], b2h5: ["F", "A"],
  b3h1: ["H"], b3h2: ["A"], b3h3: ["I", "H"], b3h4: ["B"], b3h5: ["L"],
};
// Per body: clips per zin/scène (hard cuts; bij lange zinnen wordt de scène gelijk verdeeld over de clips).
export const SCENE_CLIPS: Record<string, Record<string, string[]>> = {
  b1: { z0: ["J"], z1: ["A"], z2: ["E"], z3: ["H", "B"], z4: ["L"], z5: ["D"], z6: ["C"], z7: ["H"], cta: ["I"] },
  b2: { z0: ["J"], z1: ["G", "A"], z2: ["D"], z3: ["C"], z4: ["F", "L"], z5: ["B"], z6: ["H"], cta: ["I"] },
  b3: { z0: ["J"], z1: ["F", "G"], z2: ["H", "B"], z3: ["I"], z4: ["L"], z5: ["C"], z6: ["A", "J"], z7: ["D"], cta: ["E"] },
};
// Korte feitelijke accenten (alleen wat in het script staat)
export const CHIPS: Record<string, Record<string, [string, string]>> = {
  b1: { z0: ["Wilgenrijk, Maassluis", "Kleinschalig op een schiereiland"], z1: ["3 slaapkamers + zolder", "Laatste woningen beschikbaar"], z2: ["Kinderkamer · logeerplek · werkplek", ""],
        z3: ["Ruime percelen", "Park, water en speelnatuur vlakbij"], z4: ["Basisschool op ±5 min lopen", ""], z5: ["Warmtepomp standaard", "Zit in de prijs"], z6: ["Energielabel A+++", "Lage energielasten"], z7: ["Oplevering Q2 2028", ""] },
  b2: { z0: ["Wilgenrijk, Maassluis", "Kleinschalig op een schiereiland"], z1: ["Klaar voor de toekomst", "Vanaf dag één"], z2: ["Warmtepomp standaard", "Elders ±€15.000 extra"], z3: ["Energielabel A+++", "Woningborg-garantie"],
        z4: ["Keuken naar eigen keuze", "Uitbouw · dakkapel · inloopkast"], z5: ["Ruime percelen", "Park en water dichtbij"], z6: ["Oplevering Q2 2028", ""] },
  b3: { z0: ["De Parkhuizen", "Wilgenrijk, Maassluis"], z1: ["±185 m² woonruimte", ""], z2: ["Direct aan park en water", ""], z3: ["Terras + daktuin", "Zuidwesten"], z4: ["Eigen parkeerbox", "Onder de woning"],
        z5: ["Warmtepomp standaard", "Energielabel A+++"], z6: ["Metro ±10 min lopen", "Rotterdam ±30 min met OV"], z7: ["±€815.000", "Oplevering Q2 2028"] },
};
export const CTA_BUTTON: Record<string, string> = { b1: "Doe de financiële check", b2: "Plan een afspraak", b3: "Plan een afspraak" };

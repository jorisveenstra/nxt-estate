// Clips (public/clips, native 1080x1920 uit de Bronnenbibliotheek). [clip, woordindex waar de clip begint]
export const HOOK_CLIPS: Record<number, [string, number][]> = {
  1: [["torens-water", 0]],
  2: [["kust", 0], ["woonkamer-A", 9]], // "...zie je het ook al vanuit je eigen woonkamer"
  3: [["woonkamer-D", 0], ["torens-water", 11]],
  4: [["kust", 0], ["torens-zonsondergang", 7]],
  5: [["balkon-D", 0]],
  6: [["woonkamer-D", 0], ["torens-water", 12]],
  7: [["woonkamer-A", 0], ["balkon-D", 11]], // "Kijk dan eens naar dít uitzicht"
};
// Body: per zin-id de clips (verdeeld over de zin)
export const BODY_CLIPS: Record<string, string[]> = {
  b1: ["woontoren"],
  b2: ["woonkamer-A", "balkon-D"],
  b3: ["wijk", "torens-zonsondergang"],
  b4: ["bouwlocatie"],
  b5: ["keuken-F"],
  cta: ["balkon-ontbijt"],
};

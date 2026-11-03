// Clip-keuzes en callouts. Clips = Veo 3.1 image-to-video (9:16, 1080x1920) van de getrouwe portretcrops van de renders.
export const BODIES: Record<number, number> = { 1: 5, 2: 5, 3: 5 };
export const HOOK_CLIPS: Record<number, string[]> = {
  1: ["voorgevel", "hoekpand", "dakterras", "avond", "straat"],
  2: ["stellingen", "hal", "luchtfoto", "straat", "stellingen"],
  3: ["luchtfoto", "voorgevel", "straat", "avond", "hoekpand"],
};
// Per body de volgorde van clips voor de scènes (cyclisch, nooit twee dezelfde achter elkaar)
export const BODY_CLIPS: Record<number, string[]> = {
  1: ["hoekpand", "hal", "dakterras", "straat", "luchtfoto", "voorgevel", "dakterras", "avond", "luchtfoto"],
  2: ["hal", "stellingen", "hal", "luchtfoto", "straat", "dakterras", "voorgevel", "avond", "stellingen"],
  3: ["voorgevel", "luchtfoto", "straat", "hoekpand", "hal", "dakterras", "avond", "luchtfoto", "voorgevel", "avond"],
};
// Feitelijke callouts uit de brochure (geen rendement-, prijs- of waardeclaims)
export const CALLOUTS: Record<string, string[]> = {
  eigen: ["Nieuwbouw in Breda"], units: ["± 159 – 308 m²", "Werkruimte + kantoor"], terras: ["Eigen dakterras", "2–3 parkeerplaatsen"],
  categorie: ["Tot milieucategorie 4"], locatie: ["De Krogten · naast Makro", "A16 · A59 · A27"], oplevering: ["Oplevering Q4 2027"],
  hoogte: ["± 11 m vrije hoogte"], stapel: ["Stapel de hoogte in"], hal: ["Stalen overheaddeur", "Kantoor boven"], bereik: ["A16 · A59 · A27"],
  minuten: ["± 25 min Rotterdam", "± 10 min België"], kopen: ["Nieuwe bedrijfsunits"], zicht: ["Zichtlocatie Moerlaken"], snelweg: ["A16 · A59 · A27"],
  casco: ["Hoogwaardig betonnen casco"], prijzen: ["Via de makelaar"], hook: [],
};

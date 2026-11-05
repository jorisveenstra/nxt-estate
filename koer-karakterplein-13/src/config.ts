// Per body: shots per zin (een shot-id staat voor public/clips/<id>.mp4), kaders (callouts) en hook-shots.
// foto = echte foto (Veo-camerabeweging), impressie = ontwerpimpressie (Veo), opname = origineel rondleidingsbeeld.
export type Kind = "foto" | "impressie" | "opname";
export const kindOf = (id: string): Kind => (id.startsWith("imp-") ? "impressie" : id.startsWith("walk-") ? "opname" : "foto");

export const BODY_SHOTS: Record<number, string[][]> = {
  1: [["real-gevel"], ["real-ruimte"], ["imp-studio"], ["imp-woonwerk"], ["walk-ruimte", "imp-atelier"], ["real-ramen"], ["real-terras", "walk-kamer"], ["imp-woonkamer"], ["imp-terras"]],
  2: [["real-gevel"], ["walk-gevel", "real-binnentuin"], ["imp-atelier"], ["imp-woonwerk"], ["real-ruimte", "imp-werkkamer"], ["real-ramen", "imp-studio"], ["real-terras"], ["imp-terras"]],
  3: [["real-gevel"], ["imp-woonkamer"], ["imp-keuken"], ["real-ruimte"], ["walk-kamer", "real-ramen"], ["walk-ruimte", "walk-terras"], ["real-binnentuin", "imp-slaapkamer"], ["imp-woonwerk"], ["imp-terras"]],
};

export const BODY_CALLOUTS: Record<number, (string | null)[]> = {
  1: ["Karakterplein 13", "Geen kant-en-klaar plaatje", "Zo kan het worden", "Jij bepaalt", "Jouw maten, lijnen en licht", "Constructie · regels · kosten", "Schetsboek mee", "Jouw visitekaartje", null],
  2: ["Karakterplein 13", "Een adres met karakter", "Wonen én maken", "Jij bepaalt", "Licht · ruimte · werkplek", "Welke kamer wordt jouw atelier?", "Bespreek de prijs", null],
  3: ["Karakterplein 13", "Zo kan het worden", "Jij bepaalt", "Geen verrassingen", "Kijk zelf rond", "Neem een keurder mee", "Prijs · staat · financiering", "Jouw budget, tijd en smaak", null],
};

export const HOOK_SHOTS: Record<number, Record<number, string[]>> = {
  1: { 1: ["imp-studio"], 2: ["real-ramen"], 3: ["imp-atelier"], 4: ["imp-woonwerk", "walk-ruimte"], 5: ["imp-werkkamer"] },
  2: { 1: ["imp-atelier"], 2: ["imp-werkkamer"], 3: ["real-binnentuin"], 4: ["walk-terras", "imp-terras"], 5: ["imp-woonwerk"] },
  3: { 1: ["imp-keuken"], 2: ["real-ruimte"], 3: ["real-ramen", "imp-woonkamer"], 4: ["imp-slaapkamer"], 5: ["walk-kamer"] },
};

export const FPS_ = 30;
export const TAIL = 2.2;

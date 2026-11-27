// Shotlijst per zin. Elke zin krijgt één of meer clips (public/clips/<naam>.mp4, Veo-animaties van de
// projectrenders in bronnen/origineel). Meerdere clips binnen één zin = harde knip halverwege.
// Een lege lijst [] = het vorige shot loopt door. Alle wissels zijn harde knips, zonder overgangen.
import type { IconName } from "./icons";

export type Accent = { icon: IconName; text: string; sub?: string } | null;
export type Shot = { clips: string[]; accent: Accent };

// Hookclips per body/hook (lange hooks: twee clips)
export const HOOK_SHOTS: Record<number, Record<number, string[]>> = {
  1: { 1: ["src18"], 2: ["src15"], 3: ["src16"], 4: ["src10", "src18"], 5: ["src17"] },
  2: { 1: ["src14"], 2: ["src16"], 3: ["src19", "src17"], 4: ["src01"], 5: ["src17"] },
  3: { 1: ["src09"], 2: ["src01"], 3: ["src19", "src17"], 4: ["src12"], 5: ["src19", "src14"] },
};

// Laatste item = CTA
export const BODY_SHOTS: Record<number, Shot[]> = {
  1: [
    { clips: ["src14"], accent: { icon: "house", text: "22 bungalows", sub: "Centrum Oosthuizen" } },
    { clips: ["src08", "src10"], accent: { icon: "bed", text: "Slaap- & badkamer", sub: "op de begane grond" } },
    { clips: ["src18"], accent: { icon: "leaf", text: "Eigen tuin", sub: "onderhoudsarm" } },
    { clips: ["src17"], accent: { icon: "car", text: "Parkeren", sub: "op eigen erf" } },
    { clips: ["src05"], accent: { icon: "door", text: "Bijkeuken & berging", sub: "met deur aan de straat" } },
    { clips: ["src03"], accent: { icon: "energy", text: "Bodemenergie", sub: "zomers koelen zonder energie" } },
    { clips: ["src16"], accent: { icon: "shop", text: "Winkels & markt", sub: "op loopafstand" } },
    { clips: ["src01"], accent: null },
    { clips: [], accent: { icon: "heart", text: "Vertrouwde regio" } },
    { clips: ["src19"], accent: { icon: "calendar", text: "Oplevering", sub: "Q2 2027" } },
    { clips: ["src02"], accent: { icon: "chat", text: "Financiering?", sub: "persoonlijk bij de makelaar" } },
    { clips: ["src13"], accent: null },
  ],
  2: [
    { clips: ["src15"], accent: { icon: "pin", text: "Watering", sub: "hart van Oosthuizen" } },
    { clips: ["src14", "src19"], accent: { icon: "house", text: "22 bungalows", sub: "elk met eigen tuin" } },
    { clips: ["src11", "src10"], accent: { icon: "bed", text: "Eén woonlaag", sub: "slaap- & badkamer beneden" } },
    { clips: ["src06"], accent: { icon: "energy", text: "Bodemenergie", sub: "zomers koelen zonder energie" } },
    { clips: ["src16"], accent: { icon: "shop", text: "Dorpscentrum", sub: "boodschappen dichtbij" } },
    { clips: ["src09"], accent: { icon: "shop", text: "Winkels · markt", sub: "oude kerk · park" } },
    { clips: ["src18"], accent: null },
    { clips: ["src17"], accent: { icon: "people", text: "MFA & sport", sub: "verenigingen en clubs" } },
    { clips: ["src01"], accent: { icon: "heart", text: "Dorpse rust" } },
    { clips: ["src19"], accent: { icon: "calendar", text: "Oplevering", sub: "Q2 2027" } },
    { clips: ["src13"], accent: null },
  ],
  3: [
    { clips: ["src18"], accent: null },
    { clips: ["src14"], accent: { icon: "house", text: "22 bungalows", sub: "levensloopbestendig" } },
    { clips: ["src20", "src10"], accent: { icon: "bed", text: "Slaap- & badkamer", sub: "op de begane grond" } },
    { clips: ["src19", "src03"], accent: { icon: "leaf", text: "Eigen tuin", sub: "onderhoudsarm" } },
    { clips: ["src17"], accent: { icon: "car", text: "Parkeren", sub: "op eigen erf" } },
    { clips: ["src05", "src07"], accent: { icon: "door", text: "Berging", sub: "met deur aan de straat" } },
    { clips: ["src12"], accent: { icon: "energy", text: "Bodemenergie", sub: "zomers koelen zonder energie" } },
    { clips: ["src09"], accent: null },
    { clips: [], accent: { icon: "heart", text: "Uw keuze", sub: "op uw eigen moment" } },
    { clips: ["src15", "src06"], accent: { icon: "calendar", text: "Oplevering", sub: "Q2 2027" } },
    { clips: ["src13"], accent: null },
  ],
};

// CTA-kaart (onderin, over de beelden)
export const CTA = { title: "Plan een gesprek", sub: "met Chantal van Sopar Makelaardij", button: "Klik hieronder voor alle info" };

import React from "react";
import * as G from "./graphics";
import { IcBoxes, IcBuilding, IcDesk, IcGlass, IcVan, IcRocket } from "./ui";

export type SceneCfg = { clips: string[]; graphic: React.ReactNode };

// Per body: een scène per zin (s1..s7) + CTA. Harde sneden, geen overgangen.
export const BODY_SCENES: Record<string, SceneCfg[]> = {
  b1: [
    { clips: ["hbc-spaarne-kant-4"], graphic: React.createElement(G.AfstandCentrum) },
    { clips: ["hbc-punt-orgineel", "units-met-glazen-gevel-gecombineerd"], graphic: React.createElement(G.OptiesStapel) },
    { clips: ["units-standaard-met-glazen-overhead-deur"], graphic: React.createElement(G.TweeLagen) },
    { clips: ["h7"], graphic: React.createElement(G.Helling) },
    { clips: ["h26-10"], graphic: React.createElement(G.Parkeren) },
    { clips: ["hbc-waarderweg"], graphic: React.createElement(G.Snelwegen) },
    { clips: ["j38"], graphic: React.createElement(G.Oplevering) },
    { clips: ["punt-closeup"], graphic: React.createElement(G.CtaKaart, { vraag: "Benieuwd welke unit bij jouw bedrijf past?", knop: "Plan een afspraak", onder: "met de makelaar op de bouw" }) },
  ],
  b2: [
    { clips: ["hbc-entree-close-up"], graphic: React.createElement(G.Bedrijven) },
    { clips: ["j19"], graphic: React.createElement(G.Netwerk) },
    { clips: ["g33"], graphic: React.createElement(G.Dakterras) },
    { clips: ["j19"], graphic: React.createElement(G.Momenten) },
    { clips: ["j38-3", "h26-1"], graphic: React.createElement(G.Entree) },
    { clips: ["j38"], graphic: React.createElement(G.Energie) },
    { clips: ["units-met-glazen-gevel-gecombineerd"], graphic: React.createElement(G.Verhuurd) },
    { clips: ["punt-closeup"], graphic: React.createElement(G.CtaKaart, { vraag: "Benieuwd wie je nieuwe buren worden?", knop: "Schrijf je in", onder: "voor jouw unit in Haarlem Business Center" }) },
  ],
  b3: [
    { clips: ["hbc-waarderweg", "hbc-punt-orgineel"], graphic: React.createElement(G.Waarderweg) },
    { clips: ["j38"], graphic: React.createElement(G.Ramen) },
    { clips: ["units-met-glazen-gevel-gecombineerd", "units-standaard-met-glazen-overhead-deur"], graphic: React.createElement(G.OptiesRaster) },
    { clips: ["h26-2", "j38-3"], graphic: React.createElement(G.Specs) },
    { clips: ["hbc-punt-orgineel"], graphic: React.createElement(G.Zonnepanelen) },
    { clips: ["hbc-spaarne-kant-4"], graphic: React.createElement(G.Afstanden) },
    { clips: ["onder-het-dek"], graphic: React.createElement(G.Oplevering, { items: ["Unit kiezen", "Afspraak plannen", "Verhuizing voorbereiden"] }) },
    { clips: ["punt-closeup"], graphic: React.createElement(G.CtaKaart, { vraag: "Wil je zien hoe jouw bedrijf hier staat?", knop: "Bekijk het aanbod", onder: "en plan je afspraak met JRS Makelaars" }) },
  ],
};

// Doelgroep per hooknummer (hook 1..5 hoort bij dezelfde doelgroep in elke body)
export const DOELGROEPEN = [
  { naam: "Vakmensen & installateurs", icon: IcVan },
  { naam: "Creatieve ondernemers", icon: IcGlass },
  { naam: "Zakelijke dienstverleners", icon: IcDesk },
  { naam: "Groothandel & opslag", icon: IcBoxes },
  { naam: "Groeiende ondernemers", icon: IcRocket },
];

// Achtergrondclip per hook (b1h1 ...)
export const HOOK_CLIPS: Record<string, string> = {
  b1h1: "h26-1", b1h2: "units-met-glazen-gevel-gecombineerd", b1h3: "hbc-spaarne-kant-4", b1h4: "onder-het-dek", b1h5: "hbc-waarderweg",
  b2h1: "units-standaard-met-glazen-overhead-deur", b2h2: "j19", b2h3: "g33", b2h4: "h7", b2h5: "hbc-entree-close-up",
  b3h1: "j38", b3h2: "hbc-punt-orgineel", b3h3: "j38-3", b3h4: "h26-10", b3h5: "hbc-spaarne-kant-4",
};

# STOCK Haarlem XL — advertentievideo's (3 bodies × 5 hooks, 9:16)

Remotion-project voor de batch "FRESCH | STOCK HAARLEM XL" (Jan van Krimpenweg / Oudeweg, Haarlem).
Doelgroepen: Body 1 architectenbureaus, Body 2 marketing- en creatieve bureaus, Body 3 interieurontwerpers.

## Opbouw
- `scripts/scripts.json` — teksten (hooks, zinnen, CTA) uit de portal-snapshot (scriptversie 3).
- `scripts/maak_vo.py` — voice-overs, ElevenLabs stem `YgjXqgzBJa9op0K278OW`, model `eleven_v4` (verplicht).
- `scripts/maak_muziek.py` — instrumentale muziek per body (ElevenLabs `music_v1`, force_instrumental).
- `scripts/maak_clips.py` — image-to-video (`veo-3.1-generate-001`, 1080p, 9:16) vanuit staande startbeelden.
- `scripts/timing.py` — woordtiming -> `src/timing.json`.
- `src/config.ts` — clip per zin + accenten (lagen, chips, badges, locatiepin); `src/Video.tsx` — composities.
- `scripts/render.py` — rendert elke body één keer en elke hook apart, plakt met ffmpeg `-c copy` en mixt
  de audio (VO + muziek met ducking, loudnorm -14 LUFS).
- `bronnen/generaties.json` — provenance van alle betaalde generaties (model, stem, request-/generation-ID's).
- `bronnen/bibliotheek.json` — herkomst van elke clip (Frame.io-bibliotheek asset-ID, SHA256, generation-ID).

## Regels
Staand 1080×1920, beeld altijd full-bleed, alleen harde knippen, geen geluidseffecten, grafische
intensiteit "a_lot" (max. 35% van het beeld). Lokale Montserrat-fonts (`public/fonts`, OFL).

## Branding
Bron: stocknederland.nl/haarlem-xl — marineblauw `#112337`, turquoise `#2EBAA5`, Montserrat, wit STOCK-logo.
De in de portal ingestelde branding-URL (`https:///fresh-loods-breda.afspraakbij.info`) is ongeldig opgemaakt en
verwijst naar een landingspagina van een ander project (LOODS Breda); die huisstijl is bewust níet gebruikt.

## Beeldmateriaal
Zes clips hergebruikt uit de Bronnenbibliotheek; drie nieuwe clips (showroom, studio, werkruimte) gemaakt
van STOCK Nederland-interieurfoto's (Utrecht, impressie — niet bevestigd als Haarlem-unit).

## Revisie
`npm install` in de root, symlink `node_modules -> ../node_modules`, `npx remotion studio`,
`CHROME=<chrome-headless-shell> python3 scripts/render.py`.

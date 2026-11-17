# Westeinde 41 | Oosthuizen — advertentievideo's (DJZN ontwikkeling)

3 bodies (doelgroepen) × 5 hooks = 15 staande video's, 1080×1920 (9:16), 30 fps.

| Body | Doelgroep |
|---|---|
| b1 | Renteniers en empty nesters uit de regio |
| b2 | Doorstromende gezinnen |
| b3 | Stedelingen die landelijk aan het water willen wonen |

## Bronnen en provenance

- `bron/origineel/` — de vier officiële renders uit de Frame.io-bronnenbibliotheek (1920×1080, ongewijzigd).
- `bron/staand/` — architectuurgetrouwe staande uitsneden (1080×1920) die als startframe dienden.
- `ai-clips/` — originele, gedownloade Veo 3.1-clips (ElevenLabs Image & Video, 1080p, 9:16, 8 s, geen geluid).
- `bron/generaties.json` — elke ElevenLabs-aanvraag (prompt, model, generation-/request-ID, SHA256, geometriecontrole).
  Geen credentials.
- `bron/bibliotheek.json` — asset-IDs van de staande startframes en motion clips in de Frame.io-bronnenbibliotheek.
- `scripts/tts-cache/` — voice-over-antwoorden incl. `provenance` (model_id `eleven_v4`, voice_id `YgjXqgzBJa9op0K278OW`,
  request-id). `public/muziek/muziek.json` — muziekinstellingen (music_v1, instrumentaal) en song-id.
- Huisstijl: https://djzn.nl/westeinde41/ — logo (`public/djzn-logo.png`), oranje `#f39200`, Rokkitt + Montserrat
  (lokaal in `public/fonts/`). Zie `src/brand.ts`.

Afgekeurd: `achtergevel-boot` (camera schuift naar verzonnen buurpanden/dakramen) — niet gebruikt.
Niet gegenereerd: de overige omgevings-/leefstijlclips (bakker, markt, vaarwater, dorp …) — het ElevenLabs-tegoed was op
(aanvragen geweigerd met `quota_exceeded`, dus niet gefactureerd). Zie `bron/generaties.json`.

## Werkwijze

```bash
npm install                                 # in de repo-root; node_modules is een symlink naar ../node_modules
python3 scripts/herstel_media.py            # public/clips en public/vo opnieuw opbouwen uit ai-clips/ en tts-cache (geen credits)
npx remotion studio                         # bekijken
python3 scripts/render_alles.py             # alle 15 video's -> out/
```

- `src/config.ts` — shots per zin/hook (`naam@seconde`), accentkaarten en hook-kickers.
- `src/Video.tsx` — hook- en body-segmenten (alleen harde cuts, beeld full-bleed, ondertitels per woord, accenten, CTA).
- `scripts/render_alles.py` — rendert elk body-segment één keer en elke hook apart, plakt ze met `ffmpeg -c copy`,
  mixt voice-over + muziek (gedukt) en controleert 1080×1920 met ffprobe.
- Nieuwe aanvragen bij ElevenLabs (`maak_vo.py`, `maak_muziek.py`, `genereer_beelden.py`) kosten credits; bestaande
  resultaten worden hergebruikt en een aanvraag met onzekere uitkomst wordt nooit automatisch herhaald.

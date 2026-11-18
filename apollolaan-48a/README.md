# Apollolaan 48a | Oostzaan — advertentievideo's (DJZN ontwikkeling)

14 staande video's, 1080×1920 (9:16), 30 fps: body 1 × 5 hooks, body 2 × 4 hooks, body 3 × 5 hooks.

| Body | Doelgroep |
|---|---|
| b1 | Watersport- en natuurliefhebbers |
| b2 | Ondernemers en kapitaalkrachtige tweeverdieners |
| b3 | Regionale zoekers uit de Zaanstreek en omgeving |

## Bronnen en provenance

- `bron/origineel/` — projectbronnen uit de Frame.io-bronnenbibliotheek, ongewijzigd: achtergevel-render (1920×1080),
  omgevingsfoto ringvaart/Het Twiske (2560×1440), keuken- en woonkamerrender (1920×1080). `Woonkamer 3` en `woonkamer`
  zijn byte-identiek; één keer gebruikt. Brochuretekeningen (plattegronden, doorsnede, situatie, garage) zijn niet gebruikt
  (footage-first).
- `bron/staand/` — architectuurgetrouwe staande uitsneden (1080×1920, alleen crop + schalen) als startframe.
- `ai-clips/` — originele Veo 3.1-clips (ElevenLabs Image & Video, 1080p, 9:16, 8 s, geen geluid), gecontroleerd op
  1080×1920, SAR 1:1, geen rotatie en op beeldtrouw. Late delen van enkele clips drijven af (o.a. verzonnen dakraam
  in `achtergevel-terras` na ±4,5 s); `MAX_EIND` in `src/Video.tsx` begrenst het bruikbare deel.
- `bron/generaties.json` — elke ElevenLabs-aanvraag (prompt, model, generation-/request-ID, SHA256, geometrie). Geen credentials.
- `bron/bibliotheek.json` — asset-IDs van startframes en motion clips in de Frame.io-bronnenbibliotheek.
- `scripts/tts-cache/` — voice-overs incl. `provenance` (model_id `eleven_v4`, voice_id `YgjXqgzBJa9op0K278OW`, request-id).
- `public/muziek/muziek.json` — muziek (music_v1, instrumentaal, 72 s) met song-id; één stem voor alle varianten.
- Geen geluidseffecten (uitgeschakeld in het productiebeleid).
- Huisstijl: https://djzn.nl/project_list/apollolaan48a/ — logo (`public/djzn-logo.png`, byte-identiek aan de site),
  oranje `#f39200`, donker `#313131`, Rokkitt + Montserrat (lokaal in `public/fonts/`).

Script-opmerking: de CTA van body 3 is letterlijk ingesproken zoals aangeleverd ("plan een gesprek met Bart van Chantal").

## Werkwijze

```bash
npm install                                 # in de repo-root
python3 scripts/herstel_media.py            # public/clips + public/vo opnieuw opbouwen uit ai-clips/ en tts-cache (geen credits)
npx remotion studio                         # bekijken
python3 scripts/render_alles.py             # alle 14 video's -> out/
```

- `src/config.ts` — shots per zin/hook (`naam@seconde`), accenten (grafiekniveau "weinig") en hook-kickers.
- `src/Video.tsx` — hook- en body-segmenten: alleen harde cuts, beeld full-bleed, ondertitels per woord, kleine accenten, CTA.
- `scripts/render_alles.py` — rendert elk body-segment één keer en elke hook apart, plakt met `ffmpeg -c copy`,
  mixt voice-over + muziek (gedukt) en controleert 1080×1920 met ffprobe.
- Nieuwe ElevenLabs-aanvragen (`maak_vo.py`, `maak_muziek.py`, `genereer_beelden.py`) kosten credits; bestaande
  resultaten worden hergebruikt en een aanvraag met onzekere uitkomst wordt nooit automatisch herhaald.

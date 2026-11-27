# De Twee Gezusters (Roosendaal) – advertentievideo's

3 doelgroepen (bodies) × 5 hooks = 15 staande video's (9:16, 1080×1920), elk hook + body + CTA.

| Body | Doelgroep |
|---|---|
| 1 | Senioren en empty nesters (doorstromers) |
| 2 | Kapitaalkrachtige penthousezoekers |
| 3 | Woonzoekers uit de regio (Roosendaal en West-Brabant) |

## Beeld

- `ai-…` clips: bestaande Veo 3.1-renderclips (native 1080×1920) uit de Frame.io-Bronnenbibliotheek van dit project,
  hergebruikt zonder nieuwe generatie. In beeld gemarkeerd als "Artist impression".
- `real-…` clips: REAL-opnames (1920×1080) uit dezelfde bibliotheek, cover-fit staand uitgesneden (`cropX` in
  `scripts/clips-bron.json`), geen opvulling of uitrekken.
- Alleen harde knippen tussen shots; binnen een shot hooguit een rustige drift.
- `scripts/clips-bron.json` bevat per clip de bibliotheek-ID, SHA256, (bron-)generatie-ID en uitsnede.

## Audio

- Voice-over: ElevenLabs `eleven_v4`, stem `YgjXqgzBJa9op0K278OW` (`scripts/maak_vo.py`, herkomst in `scripts/vo-herkomst.json`).
  Body + CTA één keer per body, hooks apart.
- Muziek: ElevenLabs Music `music_v1`, instrumentaal, één bed voor alle varianten (`scripts/maak_muziek.py`,
  herkomst in `scripts/muziek-herkomst.json`), met ducking onder de stem.
- Geen geluidseffecten.

## Huisstijl

De opgegeven merkwebsite gaf tijdens productie een 404 en de projectbronnen bevatten geen logo of palet.
Daarom geen verzonnen logo: de projectnaam staat als tekst in beeld, met een rustig palet afgeleid van de
projectbeelden (parkgroen, crème, notenhout) en het lokale font Inter (`public/fonts`). Zie `src/brand.ts`.

## Werkwijze

```bash
python3 scripts/prep_clips.py <map met bibliotheekbestanden>   # public/clips + src/clips.json
python3 scripts/maak_vo.py                                     # public/vo + woordtiming (cache: geen dubbele credits)
python3 scripts/maak_muziek.py 52000                           # public/muziek/muziek.mp3 (alleen als nog niet aanwezig)
python3 scripts/timing.py                                      # src/timing.json
npx remotion studio                                            # preview: composities Body<b>-Hook<h>
python3 scripts/render_alles.py --browser <chrome-headless-shell>
```

`render_alles.py` rendert elk bodydeel één keer (`Body<b>`) en elk hookdeel apart (`Hook-B<b>-H<h>`), voegt ze
samen met `ffmpeg -c copy` en mixt daarna voice-over + muziek. Uitvoer: `out/De Twee Gezusters - Body X Hook Y.mp4`.

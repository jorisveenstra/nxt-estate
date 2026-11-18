# President Kennedylaan Heerenveen (Hetebrij Bouw)

3 bodies × 5 hooks = 15 staande ads (1080x1920, 9:16), doelgroepen: starters, jonge gezinnen, lokale doorstromers.

## Huisstijl (bron: hetebrijbouw.nl/project/president-kennedylaan-heerenveen)
- Logo: `public/logo/hetebrij.png` (Hetebrij Bouw BV, "Passie voor bijzonder bouwen"), beeldmerk `hetebrij-beeldmerk.svg`.
- Kleuren: Hetebrij-rood `#C21632`, antraciet `#1E1E1C`, logogrijs `#636569`, wit.
- Lettertype: Archivo (lokaal in `public/fonts`, geen runtime-fetch).
- Toon: helder, feitelijk en eerlijk (10 ampère transparant uitleggen), warm over rust en groen.

## Beeld
- Bronnen: verkoopbrochure-impressies uit de Frame.io-Bronnenbibliotheek (landschap 5332x3000).
- `scripts/shots.json`: per shot de echte staande uitsnede (geen outpainting) → `bronnen/staand/*.png` (1080x1920).
- `scripts/maak_clips.py`: Veo 3.1 image-to-video via ElevenLabs (9:16, 1080p, 8 s, zonder audio);
  generation-id's, hashes en prompts in `scripts/veo-ledger.json`.
- Bruikbare lengte per clip staat in `src/Video.tsx` (`USABLE`): groen-avondzon alleen de eerste 1,8 s
  (daarna verschijnt er een niet-bestaand puntdak), plattegrond-bg 3,4 s, woonkamer 5 s.
- Niet gegenereerd vanwege ElevenLabs-quota: kinderkamer (Impressie 10), groen-avondzon-v2.
- Alleen harde knippen, footage full-bleed, graphics-niveau "a_lot" (chips, label, ondertitels, CTA-kaart ≤ 35%).

## Audio
- Voice-over: ElevenLabs `eleven_v4`, stem `YgjXqgzBJa9op0K278OW` (`scripts/maak_vo.py`, provenance in `scripts/vo-provenance.json`).
- Muziek: ElevenLabs Music `music_v1`, instrumentaal, één bed voor alle varianten (`scripts/maak_muziek.py`).
- Geen geluidseffecten.

## Werkwijze
```bash
python3 scripts/maak_vo.py      # VO + woordtiming
python3 scripts/lijn_uit.py     # -> src/timing.json
python3 scripts/maak_clips.py   # Veo-clips (betaald; ledger voorkomt dubbele aanvragen)
python3 scripts/monteer.py      # bodies/hooks renderen, las met -c copy, audio mixen -> out/Body b Hook h.mp4
```

## Revisies
- Revisie 1: oplevering gewijzigd naar **herfst 2027** (was Q4 2026). Alleen de drie body-VO's
  opnieuw gegenereerd met `eleven_v4` (`scripts/revisie_body_vo.py`); hooks, Veo-clips en muziekbed hergebruikt.
  Chips "Oplevering herfst 2027" in `src/config.ts`.

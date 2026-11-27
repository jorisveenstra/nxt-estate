# Watering Oosthuizen (DJZN) — bronnen en werkwijze

3 bodies × 5 hooks = 15 staande video's (1080×1920, 30 fps). Composities: `Body<b>-Hook<h>` (volledig, met audio),
`Body<b>` en `Hook<b>-<h>` (losse beelddelen; de body wordt één keer gerenderd en met `ffmpeg -c copy` achter elke hook geplakt).

## Beeld
- 19 projectrenders uit de Frame.io-bronnenbibliotheek (`bronnen/origineel/srcNN.jpg`, niet in archief/git; staan in Frame.io).
- `scripts/portret.py`: architectuurgetrouwe staande uitsnede 1080×1920 (geen uitbreiding of vervorming) → `bronnen/portret/`.
- `scripts/genereer_clips.py`: ElevenLabs Image & Video, `veo-3.1-generate-001`, image-to-video, 9:16, 1080p, 8 s, geen audio;
  elke prompt bevat "one continuous shot, no cuts, no transitions, no morphing". Generatie-ID's, start-SHA256's en clip-SHA256's
  staan in `bronnen/ai-clips/generaties.json`. Alle clips zijn gecontroleerd: native 1080×1920, SAR 1:1, geen rotatie.
- Originele clips + staande startbeelden zijn opgeslagen in de Bronnenbibliotheek (`bronnen/bibliotheek-ids.json`).
  In het archief zitten compacte 30 fps-kopieën in `public/clips/` (origineel: Frame.io; `scripts/prep_clips.py` maakt ze opnieuw).
- Alleen harde knips tussen shots; geen overgangen.

## Audio
- Voice-over: ElevenLabs `eleven_v4`, stem `YgjXqgzBJa9op0K278OW` (`scripts/maak_vo.py`); provenance (model_id, voice_id,
  request-id, character-cost) per stuk in `scripts/tts-cache/*.json`.
- Muziek: ElevenLabs Music `music_v1`, instrumentaal, 78 s, één stem voor alle varianten (`public/music/muziek.json`: prompt, song-id).
  Gemixt in Remotion onder de stem met ducking en fades. Geluidseffecten: uitgeschakeld.

## Huisstijl
Bron: djzn-watering-oosthuizen-versie1.afspraakbij.info — logo (Watering, comfortabel wonen), marineblauw #262D44,
goud #9A732F, zand #EEE9E2, koppen Josefin Sans (kapitalen), tekst Merriweather. Lettertypen lokaal in `public/fonts/`.

## Renderen
`npm install` in de root (projectmap gebruikt `node_modules` → `../node_modules`), dan `bash scripts/render_alles.sh`.

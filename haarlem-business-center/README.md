# Haarlem Business Center – advertentievideo's (9:16, 1080x1920)

3 bodies x 5 hooks. Remotion 4.0.532 (zie package.json in de root van het project; lockfile meegeleverd).

- `scripts/scripts.json` teksten; `scripts/maak_vo.py` voice-over (ElevenLabs `eleven_v4`, voice `YgjXqgzBJa9op0K278OW`,
  antwoorden + request-id's in `scripts/tts-cache/*.json`); `src/timing.json` woordtiming.
- `src/config.ts` clipkeuze per scène/hook + callouts; `src/Video.tsx` compositie ("Body<b>" en "Hook<b>-<h>").
- `scripts/render_all.py` rendert body en hook apart, plakt ze met `ffmpeg -c copy` en mengt VO + muziek (ducking).
- Beeld: foto's -> 1080x1920 portretcrop (`portrait/pNN.png`, bronfoto's `orig/oNN.jpg` + sha256 in
  `scripts/source-images.json`) -> ElevenLabs Image & Video `veo-3.1-generate-001`, 1080p, 9:16, 8 s
  (generatie-id's in `scripts/generation-ledger.json`). In dit archief staan de clips opnieuw gecodeerd (crf 22).
- Muziek: ElevenLabs Music `music_v1`, instrumentaal, 75 s (`public/music/`, instellingen + song-id in `scripts/music.json`).
- Huisstijl: haarlembusinesscenter.nl – Fivo Sans / TradeGothic LT Extended (lokaal in `public/fonts`), #29373D, #FF840B, #845C3C, #CAB766.
- Harde sneden, geen overgangen; footage full-bleed; grafisch niveau "medium" (<25% beeld).

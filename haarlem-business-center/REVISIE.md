# Haarlem Business Center — editbare bron (Remotion)

Staand 9:16, 1080x1920, 30 fps. Opbouw per video: hook (comp `Hook-b<B>h<H>`) + body (comp `Body-b<B>`), harde sneden (geen overgangen).

- `src/` Remotion-code (`Video.tsx`, `graphics.tsx` = uitleganimaties, `config.ts` = clip/graphic per zin, `timing.json` = woordtiming)
- `scripts/scripts.json` scripttekst; `maak_vo.py` voice-over (ElevenLabs **eleven_v4**, stem YgjXqgzBJa9op0K278OW); `lijn_uit.py` timing
- `scripts/maak_muziek.py` + `public/muziek/` ElevenLabs Music (music_v1, instrumentaal), instellingen/Song-Id in `muziek.json`
- `scripts/genereer_clips.py` + `ai-renders/ledger.json` foto -> video (veo-3.1-generate-001, 1080p, 9:16): bron-SHA256 en generation-id's
- `scripts/kader_clips.py` zet clips met zwarte balken op een vervaagde vulling (geen nieuwe generatie)
- `scripts/render_alles.py` rendert en mixt (voice-over + muziek met ducking) -> `out/body<B>-hook<H>.mp4`
- `scripts/tts-cache/*.json` herkomst per voice-over (model_id, voice_id, request-id's); geen credentials in dit archief

Installeren: `npm install` (lockfile meegeleverd). Browser: `--browser-executable <chromium/headless-shell>`.
Branding: haarlembusinesscenter.nl + brochure (leisteen #29373d, koper #b8804e, oranje #ff840b; Fivo Sans en Trade Gothic Extended lokaal in `public/fonts`).

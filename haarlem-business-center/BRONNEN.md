# Haarlem Business Center – bronnen en context voor revisies

- Opdracht: 3 bodies (Body 1–3) met hooks (zie `src/config.ts` → `VIDEOS`), 16:9, 1920×1080, 30 fps. Opdrachtlimiet is 10 video's; hier 9 (hook 1–3 voor body 1 en 3; hook 1, 3, 4 voor body 2). Hooks 4–5 (body 1/3) en 2/5 (body 2) staan wel in de scripttekst en kunnen met `scripts/scripts.json` + `VIDEOS` worden toegevoegd.
- Scripttekst: `scripts/scripts.json` (hooks, zinnen per scène, CTA). Voice-over: ElevenLabs TTS (voice Koen, `eleven_multilingual_v2`), woordtiming via `scripts/maak_vo.py` → `src/timing.json`.
- Muziek: ElevenLabs Music (instrumentaal, upbeat, 90 s) → `public/muziek/achtergrond.mp3`.
- Beelden: de aangeleverde foto's zijn met ElevenLabs Image & Video (`veo-3.1-generate-001`, 1080p, 8 s, 16:9, geen audio) geanimeerd.
  Bron-hashes, asset-id's en generation-id's staan in `scripts/clips-state.json`; prompts in `scripts/genereer_clips.py`.
  Let op: Veo weigert `enhance_prompt=false` ("prompt enhancement cannot be disabled"), daarom is die parameter weggelaten.
  In dit archief staan de clips als bijna-verliesvrije H.264-kopieën (`public/clips/*.mp4`, de originele generaties zijn ~28 MB per clip en passen niet in de 200 MB-limiet). Gebruik bij revisies deze clips opnieuw; genereer niet opnieuw.
- Foto's: `public/foto-jpg/` (JPEG-versie die naar ElevenLabs is geüpload); SHA-256 van de originele PNG's staat in `clips-state.json`.
- Huisstijl: de website https://www.haarlembusinesscenter.nl/ was vanuit de uitvoeromgeving niet bereikbaar (netwerkbeleid). Huisstijl is daarom gehaald uit de opgegeven kleuren (#29373D leisteen, #845C3C brons), de aangeleverde HTML-kop (thema-kleur, favicon) en de aangeleverde brochure (logo, koppen in hoofdletters in een brede vette grotesk – Trade Gothic Bold Extended, tekst in Fivo Sans). Google-equivalenten: Archivo en Figtree (lokaal in `public/fonts/`). Logo: `public/logo/hbc-logo.png` (uit de brochure).
- Stijl: rustig, geen rare overgangen (zachte crossfade tussen clips, rustige fade-ins), dikke graphics per zin (`GRAPHICS` in `src/config.ts`).
- Renderen: `npm install`, dan `BROWSER=<chrome-headless-shell> node scripts/render.mjs` of `npx remotion render Body1-Hook1 out/x.mp4`.

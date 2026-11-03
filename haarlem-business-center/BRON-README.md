# Haarlem Business Center – horecaruimte (Body 1 × Hook 1–5)

Editbare Remotion-bron (1080×1920, 9:16, 30 fps, alleen harde knips).

- `src/` Remotion-compositions `Body1-Hook1..5`; `src/config.ts` kiest clips/callouts per hook en scène.
- `scripts/scripts.json` (teksten), `maak_vo.py` (ElevenLabs `eleven_v4`, stem `YgjXqgzBJa9op0K278OW`), `lijn_uit.py` (woordtiming → `src/timing.json`).
- `public/vo/*.wav` voice-overs; `scripts/tts-cache/*.mp3` + `*.meta.json` (request-id's, geen sleutels).
- `public/muziek/music.mp3` + `scripts/music-provenance.json`: ElevenLabs Music `music_v1`, instrumentaal (song-id in provenance).
- `public/fonts` Poppins (lokaal), `public/logo/logo.svg` (haarlembusinesscenter.nl), huisstijl: bruin #845C3C, goud #BFA349, saliegroen #B8C4AD, crème #F6F4EF.
- `clips-manifest.json`: de 14–16 hergebruikte native 1080×1920 Veo-clips uit de Frame.io-bronnenbibliotheek met sha256 en generation-id's. De clipbytes zitten niet in dit archief; plaats ze in `public/clips/<naam>.mp4` en render met `npx remotion render Body1-Hook1 out/x.mp4`.
- Geen nieuwe beeldgeneratie voor dit batch; geen geluidseffecten (uitgeschakeld).

# Haarlem Business Center – horecaruimte (Body 1 × Hook 1–5)

Editbare Remotion-bron (1080×1920, 9:16, 30 fps, alleen harde knips).

- `src/` Remotion-compositions `Body1-Hook1..5`; `src/config.ts` kiest clips/callouts per hook en scène.
- `scripts/scripts.json` (teksten), `maak_vo.py` (ElevenLabs `eleven_v4`, stem `YgjXqgzBJa9op0K278OW`), `lijn_uit.py` (woordtiming → `src/timing.json`).
- `public/vo/*.wav` voice-overs; `scripts/tts-cache/*.mp3` + `*.meta.json` (request-id's, geen sleutels).
- `public/muziek/music.mp3` + `scripts/music-provenance.json`: ElevenLabs Music `music_v1`, instrumentaal (song-id in provenance).
- `public/fonts` Poppins (lokaal), `public/logo/logo.svg` (haarlembusinesscenter.nl), huisstijl: bruin #845C3C, goud #BFA349, saliegroen #B8C4AD, crème #F6F4EF.
- `clips-manifest.json`: de 14–16 hergebruikte native 1080×1920 Veo-clips uit de Frame.io-bronnenbibliotheek met sha256 en generation-id's. De clipbytes zitten niet in dit archief; plaats ze in `public/clips/<naam>.mp4` en render met `npx remotion render Body1-Hook1 out/x.mp4`.
- Geen nieuwe beeldgeneratie voor dit batch; geen geluidseffecten (uitgeschakeld).

## Batch 2026-11-26 (3 bodies × 5 hooks, WhatsApp-impressies) — afgebroken
- `bronnen/startbeeld-uitsnedes.json`: getrouwe 9:16-uitsnede (crop-middelpunt x) per WhatsApp-impressie uit de Frame.io-bronnenbibliotheek
  (bron 1600x900/1471x1069 → crop 506x900/601x1069 → 1080x1920). "17.28.41" is een kopie van "17.29.31" met logo en is overgeslagen.
- `scripts/maak_clips.py` + `scripts/el.py`: Veo 3.1 image-to-video (1080p, 9:16, 8 s) met grootboek `bronnen/generaties.json`.
- De job is gestopt op ElevenLabs `quota_exceeded` (26 credits over). Alle aanvragen zijn met HTTP 401 geweigerd, dus er is niets in rekening gebracht.

# Baraca Village (Tampah Beach Villa's) - editbare bron

Remotion-project (`src/`), props per deel (`props/`), gebruikte shots (`public/clips`), voice-over (`public/vo`, ElevenLabs eleven_v4,
stem YgjXqgzBJa9op0K278OW, request-ID's in `vo-meta.json`), muziek (`public/muziek`, ElevenLabs music_v1, `muziek-meta.json`) en
lokale fonts (`public/fonts`, Poppins + Marcellus).

- Final = hook-deel (`props/b<B>h<H>-hook.json`) + body-deel (`props/body<B>.json`), harde cut, ffmpeg concat.
- Render: `npm install` en dan `npx remotion render src/index.ts Ad out/deel.mp4 --props=props/<bestand>.json` (1080x1920, 30 fps).
- Shots: 3 s native 1080x1920-fragmenten uit de originele 4K-landscapebeelden (alleen baraca_village-bronnen), cover-fit crop met pan
  (`scripts/maak_shots.py`, bron-SHA256 in `shots.json`). Geen AI-regeneratie, geen padding, alleen harde cuts.
- Branding: website tampah-beach-villas.afspraakbij.info (Poppins, goud #d7b270 / #c4923e, groen #397052) + brochure (Marcellus-woordmerk, olijf/crème).
- Rendement wordt altijd als prognose getoond. Geen sleutels of tokens in dit archief.

# Haarlem Business Center — advertentievideo's

3 bodies (doelgroepen) × 5 hooks = 15 video's, staand 9:16 (1080×1920, 30 fps).

| Body | Doelgroep |
|---|---|
| 1 | Creatieve, media- en marketingbureaus (incl. recruitment) |
| 2 | Interieur-, design- en keukenbedrijven met showroom |
| 3 | Zakelijke dienstverleners en datagerichte bedrijven |

## Regels
- Footage vult altijd het hele beeld; alleen harde knippen tussen shots (geen overgangen).
- Grafische accenten: kleine feitenlabels, ondertitels, logo en CTA (samen < 35% van het beeld).
- Stem: ElevenLabs `eleven_v4`, stem `YgjXqgzBJa9op0K278OW`. Muziek: ElevenLabs Music `music_v1`, instrumentaal. Geen SFX.
- Huisstijl van haarlem-business-center-versie1.afspraakbij.info: Poppins (lokaal), baksteenbruin `#845c3c`, goud `#bfa349`.

## Werkwijze
1. `python3 scripts/maak_vo.py` → `public/vo/*.wav` en `src/timing.json` (woordtiming uit ElevenLabs).
2. `python3 scripts/maak_muziek.py` → `public/muziek/b<B>.mp3` (één muziekbed per body, hergebruikt over de hooks).
3. Clips: `public/clips/` (zie `scripts/bronnen.json`: bibliotheek-ID's, sha256, generatie-ID's). Ontbrekende clips
   ophalen met `python3 scripts/haal_clips.py library.json`.
4. Preview: `npx remotion studio` (compositie `Body<B>-Hook<H>`).
5. Renderen: `python3 scripts/render.py --browser <chrome-headless-shell>` — rendert elke body één keer en per variant
   alleen de hook, voegt samen met `ffmpeg -c copy` en mixt stem + muziek → `out/final/Body <B> Hook <H>.mp4`.

`src/config.ts` bepaalt welke clip bij welke hook/scène hoort en welke feitenlabels verschijnen.

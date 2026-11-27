# Tampah Beach Villas | Baraca Capital — 3 bodies × 5 hooks (staand 1080×1920)

Script versie 3 (portal), doelgroepen: rendementsbelegger (body 1), vroege instapper met Bali als referentie
(body 2), combinatiegebruiker zelf genieten + verhuren (body 3). Op verzoek van de klant **alleen Baraca
Village-beelden**: tien 4K-renderanimaties uit de Frame.io-bronnenbibliotheek, staand bijgesneden
(`scripts/prep_clips.sh`, geen padding/vervorming) en drie bestaande native 9:16 Veo 3.1-clips uit dezelfde
bibliotheek (`scripts/sources.json`: hashes, asset-ID's, generatie-ID's). Er zijn geen nieuwe AI-beelden gegenereerd.

## Productie
- Voice-over: ElevenLabs, stem `YgjXqgzBJa9op0K278OW` (Tijs, NL), **model `eleven_v4`**; herkomst en request-ID's
  in `scripts/vo-provenance.json`, ruwe antwoorden + timing in `scripts/tts-cache/`, audio in `public/vo/`.
- Muziek: ElevenLabs Music `music_v1`, instrumentaal, 70 s, één stem voor alle varianten
  (`scripts/music-provenance.json`, `public/music/muziek.mp3`), zacht onder de stem met ducking.
- Geen geluidseffecten (uitgeschakeld in het productiebeleid).
- Huisstijl van https://tampah-beach-villas.afspraakbij.info: Poppins (lokaal in `public/fonts/`), goud
  hsl(38 56% 51%) ≈ #c9963f, lichtgoud #d7b270, donkergoud #9b6e29, groen #397052, crème #f8f4ec. De site heeft
  geen logobestand; het woordmerk "TAMPAH BEACH VILLA'S" is in Poppins gezet.
- Grafische intensiteit: a_lot (accenten per zin, max ~35% van het beeld), beeld blijft full-bleed, alleen harde cuts.

## Werkwijze
1. `python3 scripts/maak_vo.py` (cache: dezelfde tekst kost nooit opnieuw credits)
2. `python3 scripts/timing.py` → `src/timing.json`
3. Beeldplan en accenten: `src/config.ts`; opmaak: `src/Video.tsx`; kleuren: `src/brand.ts`
4. Bekijken: `npx remotion studio` → compositie `Body<b>-Hook<h>` (met audio)
5. Eindrender: `python3 scripts/render.py` — rendert `Body-b<b>` één keer en `Hook-b<b>-h<h>` per hook (zonder
   audio), plakt ze met `ffmpeg -c copy` en mixt voice-over + muziek; uitvoer `out/Body <b> Hook <h>.mp4`.

`node_modules` komt van `npm ci` in de repo-root (zie `package-lock.json`).

# Baraca Village – advertentievideo's (Tampah Beach Villas | Baraca Capital)

3 bodies × 4–5 hooks = 14 staande video's (1080×1920, 30 fps, harde cuts, geen overgangen).

| Body | Doelgroep | Hooks |
|---|---|---|
| 1 | Vroege instapper en trendvolger (Bali-vergelijking) | 4 |
| 2 | Vermogensspreider en portefeuillebouwer | 5 |
| 3 | Levensgenieter met tweede-huis-droom | 5 |

## Bronnen
Alleen beelden met `baraca_village` in de naam uit de Frame.io-Bronnenbibliotheek (`media/bronnen.json`:
library-ID's en SHA256). De 4K-liggende originele video's worden onderwerpgericht bijgesneden tot staande clips
(`scripts/maak_clips.py`, geen opvulling). Drie foto's zonder bestaande video (straat, speeltuin, badkamer) zijn
via een getrouwe staande uitsnede (`media/portret/`) met ElevenLabs Image & Video (veo-3.1-generate-001, 1080p,
9:16, 8 s) tot bewegend beeld gemaakt (`media/beweging/`, generatie-ID's in `generaties.json`).

## Audio
- Voice-over: ElevenLabs, stem `YgjXqgzBJa9op0K278OW`, model `eleven_v4` (herkomst: `scripts/vo-provenance.json`).
- Muziek: ElevenLabs Music `music_v1`, instrumentaal, "uplifting Lombok/Bali" (`public/muziek/*.json`).
- Geluidseffecten: ElevenLabs Sound Effects (`public/sfx/*.json`), subtiel onder de stem.
- Mix: `scripts/mix_audio.py` (ducking, fades, -14 LUFS).

## Huisstijl
Volgens tampah-beach-villas.afspraakbij.info: Poppins (lokaal in `public/fonts`), goud `#c4923e`, crème `#f8f5ef`,
groen `#397052`, witte kapitalen op beeld; woordmerk BARACA VILLAGE zoals op de poort van het project.
"Baraca Village" (en "Baraca Capital", bedragen + eenheid) staat in ondertitels altijd samen op één regel.

## Werkwijze / revisie
1. `npm install` in de root (deze map gebruikt `../node_modules`).
2. Tekst wijzigen: `scripts/scripts.json` → `python3 scripts/maak_vo.py` (alleen gewijzigde tekst kost credits).
3. `python3 scripts/lijn_uit.py && python3 scripts/plan.py` (shots/accenten per woord in `scripts/plan.py`).
4. Bekijken: `npx remotion studio` (composities `Body<b>-Hook<h>`, plus segmenten `Hook-B<b>-H<h>` en `Body-B<b>`).
5. Renderen: `CHROME=<chrome-headless-shell> python3 scripts/render.py` → `out/Body <b> Hook <h>.mp4`.

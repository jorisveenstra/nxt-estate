# Elbe 23 Den Haag (Business Nomads) – autobedrijven en garages

Staande advertenties (1080x1920, 9:16) voor de 14 bedrijfsunits aan de Elbe 23 op Forepark, Den Haag.
Doelgroep: autobedrijven, garages, detailing- en bandenspecialisten. Eén body × vijf hooks:
`Body1-Hook1` … `Body1-Hook5` (portal-titels "Body 1 Hook N").

## Bronnen
- Beeld: 13 native 1080x1920 Veo 3.1-clips (`public/clips/foto01..13.mp4`) uit de Frame.io
  Bronnenbibliotheek van dit project; hashes en generation-ID's in `scripts/clips-provenance.json`.
  Alleen harde cuts, beeld altijd beeldvullend (cover), geen overgangen.
- Voice-over: ElevenLabs `eleven_v4`, stem `YgjXqgzBJa9op0K278OW` (`scripts/maak_vo.py`,
  provenance met request-ID's in `scripts/vo-provenance.json`, ruwe antwoorden in `scripts/tts-cache/`).
- Muziek: ElevenLabs Music `music_v1`, instrumentaal, 65 s, gedeeld door alle hooks
  (`public/muziek/b1-bed.mp3`, prompt en song-id in `scripts/muziek-provenance.json`).
  Geen geluidseffecten (uitgeschakeld in het productiebeleid).
- Huisstijl (elbe-23-den-haag.afspraakbij.info): logo Business Nomads (`public/logo/`), olijf #7b7451,
  donker #1b221f, crème #ebe9d8, groen "Nu in verkoop"-label, Poppins (lokaal in `public/fonts/`).
  Graphics-niveau "a_lot": feitenkaarten per zin, max. ±35% van het beeld; footage blijft dominant.

## Werkwijze
1. Tekst: `scripts/scripts.json` (uitspraak van getallen in `UITSPRAAK` in `maak_vo.py`).
2. `python3 scripts/maak_vo.py` → `public/vo/*.wav`, `scripts/woorden-tts.json` (gecachet, geen dubbele credits).
3. `python3 scripts/lijn_uit.py` → `src/timing.json` (woorden + zinnen/scènes).
4. Shots per zin/hook en kickers: `src/config.ts`. Graphics: `src/Video.tsx`, `src/ui.tsx`.
5. `bash scripts/render.sh`: rendert `Body-b1` één keer en `Hook-b1hN` los (zonder audio), plakt met
   `ffmpeg -c copy` en mixt voice-over + muziekbed met ducking (`scripts/assemble.py`).
   `Body1-HookN` in de studio (`npx remotion studio src/index.ts`) is dezelfde video inclusief audio.

Installatie: `npm install` in de repository-root (deze map linkt `node_modules` naar `../node_modules`).

# Boxcomplex Waddinxveen — 3 bodies × 5 hooks (staand 1080×1920)

Elke video = hooksegment (`Seg-b<B>-h<H>`) + bodysegment (`Seg-b<B>`), harde cuts, beeldvullende footage.
Volledige preview incl. audio in de Studio: compositie `Body<B>-Hook<H>`.

## Werkwijze
1. Tekst: `scripts/scripts.json` (`{weergave|uitspraak}` voor bedragen/afkortingen).
2. Voice-over: `python3 scripts/maak_vo.py` via run-script — ElevenLabs **eleven_v4**, stem `YgjXqgzBJa9op0K278OW`
   (provenance per opname in `generatie/vo/*.json`: model, voice, request-id, alignment).
3. Timing + montageplan: `python3 scripts/lijn_uit.py && python3 scripts/plan.py` → `src/timing.json`, `src/plan.json`.
4. Beelden: `public/clips/*.mp4` — Veo 3.1 (ElevenLabs Image & Video, 1080p, 9:16, 8 s) vanaf staande uitsneden
   (`ai-renders/portret*`) van de projectrenders. Prompts, generatie-ID's en instellingen: `generatie/ledger.json`, `generatie/shots.json`.
   Bronrenders zelf staan in de Frame.io-bronnenbibliotheek (ID + SHA256: `generatie/bronnen-bibliotheek.json`);
   startbeelden en clips zijn daar ook opgeslagen (`generatie/portret-bibliotheek.json`, `generatie/clips-bibliotheek.json`).
5. Muziek: `public/muziek/muziekbed.mp3` — ElevenLabs Music `music_v1`, instrumentaal, 72 s (instellingen in ledger).
   Geen geluidseffecten.
6. Render: `BROWSER=<chrome-headless-shell> bash scripts/render_all.sh` (segmenten, zonder audio), daarna
   `python3 scripts/assemble.py` (concat -c copy + VO/muziekmix met ducking + loudnorm, faststart).

Huisstijl (waddinxveen.boxcomplex.nl): oranje #FC4D00, navy #0A2540, lichtblauw #92CEE8, Roboto Condensed (lokaal in `public/fonts`).
Sleutels staan nooit in deze map; ElevenLabs-authenticatie komt uit de omgeving.

## Revisie 1 (Frame.io-feedback 18-11-2026)
- Body 1: zin "materiaal en gereedschap kwijt" herschreven ("Beneden is plaats voor…"); boven = extra ruimte, *bijvoorbeeld* voor administratie (geen eis).
- Alle bodies: oplevering **eind Q2 2027** (VO + callouts).
- Body 2 Hook 4: hook beantwoordt nu de openingsvraag (vermogen opbouwen i.p.v. huur betalen), met harde cut naar een tweede clip.
- Body 2/3 Hook 5: "Dit zijn de nieuwe bedrijfsunits" (meervoud).
- Nieuw ingesproken met eleven_v4 (stem ongewijzigd): b1_body, b2_body, b3_body, b2_h4, b2_h5, b3_h5. Oude provenance in `generatie/vo-rev0/`.
- Clips (Frame.io-bibliotheek) en muziekbed hergebruikt; geen nieuwe beeldgeneratie, geen geluidseffecten.

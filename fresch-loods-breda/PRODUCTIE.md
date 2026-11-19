# Fresch Loods Breda — advertentievideo's (2 bodies × 5 hooks)

Project: FRESCH | LOODS BREDA, Rudonk 10, 4842 AX Breda. Scriptversie 5 (portal).
Doelgroepen: b1 = groothandels in kleding en textiel, b2 = groeiende import- en distributiebedrijven.

## Formaat en regels
- Staand 9:16, 1080×1920, 30 fps, vierkante pixels, geen rotatie. Footage beeldvullend (cover), geen letterbox/padding.
- Alleen harde knippen tussen shots; geen overgangen. Graphics-niveau "weinig": klein logo, ondertitels,
  4 korte goudkleurige feitenlabels per body en een compacte CTA-kaart (< 15% van het beeld).
- Muziek en geluidseffecten staan UIT (productionPolicy) en zitten niet in de mix.

## Huisstijl (bron: fresch-loods-breda-versie1.afspraakbij.info)
- Logo: LOODS Nederland (public/logo/loods-nederland.svg, van de site), goud rgb(191,163,73) + wit.
- Kleuren: goud #BFA349, antraciet #1A1A1A, zand #E7E2DA. Lettertype: Poppins (lokaal in public/fonts).

## Voice-over
- ElevenLabs TTS, voice_id YgjXqgzBJa9op0K278OW, model_id "eleven_v4" (expliciet, geen fallback), language_code nl.
- Herkomst per aanvraag (request-id, history-item-id, kosten): scripts/vo-herkomst.json. Audio: scripts/tts-cache/.
- Uitspraak: "Fresch" → "Fresh", "m²" → "vierkante meter" (zie UITSPRAAK in scripts/maak_vo.py).

## Beeld
- Bronnen (Frame.io Bronnenbibliotheek van dit project): 5 unieke renders (bronnen/origineel/). Unit 1/3/5 en
  Unit 2/4/6 zijn byte-identiek aan resp. gevel-daglicht en gevel-avond-overheaddeur.
- Bouwupdate-video (2160×2160) is NIET gebruikt: er staan doorlopend ingebrande LOODS-marketingteksten in beeld
  (o.a. "625-655 m²", afwijkend van het script) die bij een staande uitsnede half afgesneden zouden worden.
- Staande startfoto's: getrouwe uitsnedes 1080×1920 (bronnen/staand/), geen outpainting.
- Beweging: ElevenLabs Image & Video, veo-3.1-generate-001, 1080p, 9:16, 8 s, zonder audio, startframe als asset.
  Generatie-ID's, asset-ID's, prompts en hashes: bronnen/generaties/*.json. Clips: public/clips/.
- Afgekeurd: gevel-entree-daglicht (Veo voegt na ~1 s een niet-bestaande trappenhuistoren/glasgevel toe);
  bewaard in bronnen/afgekeurd/ ter documentatie, niet gebruikt.

## Werkwijze
1. `python3 scripts/maak_vo.py` (alleen nieuwe teksten kosten credits; cache in scripts/tts-cache)
2. `python3 scripts/lijn_uit.py` → src/timing.json + public/vo/*.wav
3. Clips per zin: src/config.ts. Bekijken: `npx remotion studio` (composities Body<b>-Hook<h>).
4. `python3 scripts/render.py` → body één keer per body, hooks apart, ffmpeg-concat + audio → out/.

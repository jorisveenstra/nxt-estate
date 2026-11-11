# Wonen in de Oevers (Maassluis) - bronnenarchief

## Versie 2 (revisie): alleen de 4 beschikbare tussenwoningen
- Scripts toegespitst op de laatste vier tussenwoningen (bouwnummers 16, 31, 33, 39; fase 1): 129 m² gebruiksoppervlakte,
  kavels 155-172 m², 481 m³, 3 woonlagen, 5 slaapkamers, berging, vloerverwarming, aardwarmtepomp, gasloos, BENG,
  prijzen €592.500 - €605.000. Het woord "Parkhuizen" komt niet meer voor; body 3 richt zich nu op dezelfde tussenwoningen.
- Beeld: uitsluitend de vier renders met "tussenwoning" in de naam uit de hoofdmap van de Frame.io-bronnenbibliotheek
  (provenance/originelen). De renders in Bronnenbibliotheek/Archief en alle eerdere clips (A-L, gemaakt van archiefrenders)
  worden NIET meer gebruikt.
- Per render meerdere staande 9:16 uitsneden (provenance/portrait, alleen bijsnijden/schalen, geen outpainting) en per uitsnede een
  eigen Veo 3.1 clip met een andere camerabeweging (scripts/veo2.py, provenance/veo-generations.json, provenance/bronnen.json).
- Voice-over: ElevenLabs eleven_v4, stem YgjXqgzBJa9op0K278OW. Ongewijzigde hooks uit versie 1 (ook eleven_v4) zijn hergebruikt;
  nieuwe bodies en gewijzigde hooks zijn opnieuw ingesproken (provenance/narration-requests.json).
- Muziek: bestaande ElevenLabs music_v1-stem (instrumentaal, 80 s) hergebruikt; geen geluidseffecten.
- Graphics (niveau "a_lot"): feitenchips per zin, badge "Nog 4 beschikbaar", groot "4"-accent, CTA-regel. Harde knips, geen overgangen.

## Merk
- wonenindeoevers.nl (screen.css gecontroleerd): saliegroen #708c7a, goud #d1b56b, crème #eeece6, grijs #6e7373, serif-logo.
  Typekit "museo-sans" is niet lokaal beschikbaar: koppen Bitstream Charter, tekst Inter (lokaal).
- Formaat 1080x1920 (9:16).
- Bouwen: scripts/maak_vo.py, scripts/maak_timing.py, scripts/render_alles.sh (vereist node_modules via ../package.json van de repo).

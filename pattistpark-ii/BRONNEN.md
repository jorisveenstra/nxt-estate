# Pattistpark II – bronnen en herkomst

- Opdracht: 2 bodies x 5 hooks, staand 9:16, 1080x1920, 30 fps, harde sneden, grafiek-niveau "a_lot" (≤35% van het beeld), muziek aan.
- Huisstijl (topvast-pattispark.afspraakbij.info): taupe #AF9982, marine #1A2235, oranje #ED5D25, crème #E7E2DA, lettertype Poppins (lokaal in public/fonts). Geen logobestand gevonden op de site; de woordmerk-tekst "PATTISTPARK II / TERNEUZEN" is in Poppins gezet. www.pattistpark.nl gaf 404.
- Voice-over: ElevenLabs, voice_id YgjXqgzBJa9op0K278OW, model_id eleven_v4 (zie scripts/vo-provenance.json en tts-cache). 
- Muziek: ElevenLabs Music music_v1, instrumentaal (public/muziek/muziek.json, song-id).
- Beeld: elke foto -> portret-startframe 1080x1920 (subject-bewuste crop, geen outpainting, architectuur ongewijzigd; public/portrait) -> ElevenLabs Image & Video veo-3.1-generate-001, 1080p, 9:16, 8 s, zonder audio. Generatie-ID's, bron-SHA256 en asset-ID's: ledger.json.
  Foto 01 (bs26071617420.jpg) is een vrijwel identieke opname van foto 00 en is niet apart geanimeerd; dubbele bestanden (Type A/D/F, 2x) zijn samengevoegd op SHA256.
- De clips in public/clips zijn voor dit archief opnieuw gecodeerd (kleiner); de originele Veo-uitvoer is opnieuw op te halen via de generatie-ID's in ledger.json. De originele foto's (groot) zijn niet meegepakt; hashes staan in orig-index.json.
- Renderen: `node_modules` installeren (zie package.json/lockfile in de root van de repo), daarna `python3 scripts/render_all.py <pad-naar-chromium>`; voor de studio `npx remotion studio`. Composities: Body<b>-Hook<h> (volledig, met audio), Body<b>-Deel en Body<b>-Hook<h>-Deel (alleen beeld; render_all plakt ze met ffmpeg en mixt audio met ducking).
- Geen sleutels in dit archief: ElevenLabs-aanroepen gingen via proxy-geïnjecteerde authenticatie.

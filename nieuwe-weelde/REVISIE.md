# Revisie-instructies (Nieuwe Weelde, Body-3-Hook-1)

Bewerkbaar Remotion-project. Compositions: `Body3` (body + CTA) en `Hook3-1`; de definitieve video is Hook + Body met een harde cut
(`scripts/render_alles.py` toont de volledige keten: render, concat -c copy, audiomix met ducking).
- Teksten, clips per zin, callouts: `scripts/scripts.json`; timing per woord: `src/timing.json`.
- Voice-over: ElevenLabs model `eleven_v4`, stem `YgjXqgzBJa9op0K278OW` (zie `bron/tts-provenance.json`); alleen hergebruiken met deze provenance.
- Muziek: `public/muziek/` (ElevenLabs Music `music_v1`, instrumentaal; instellingen + song-id in `muziek-instellingen.json`).
- Clips: lichte kopieën in `public/clips/`; volledige 1080x1920-originelen + generatie-ID's (`bron/gen-ledger.json`) staan in de Frame.io-bronnenbibliotheek van het project.
- Beeldformaat altijd 9:16 (1080x1920), alleen harde cuts, footage full-bleed, graphics-niveau "a_lot" (max 35% van het beeld).
- Branding: salie-groen #6c887a, zand #d4c6af, goud (Goud Wonenconcept), logo's in `public/`; bron: https://aanbod.vorm.nl/nieuweweelde.

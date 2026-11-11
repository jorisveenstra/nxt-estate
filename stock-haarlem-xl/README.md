# STOCK Haarlem XL - 2 bodies x 5 hooks
Remotion-project, 1080x1920, 30 fps. `npm run data` leest `provenance/*.json` (ElevenLabs eleven_v4, voice YgjXqgzBJa9op0K278OW, alignment) naar `src/data.json`.
Render: `npx remotion render src/index.ts Body1-Hook1 out/x.mp4`. Fonts: Poppins (lokaal, public/fonts). Merkreferentie: fresh-loods-breda.afspraakbij.info (Poppins, goud #BFA349, blauw #57779B).
`public/start` = 9:16 startbeelden (crops van de bronrenders), `public/clips` = Veo 3.1 image-to-video (generation IDs in `provenance/clip-*.json`), muziek: ElevenLabs music_v1 (`provenance/music.json`).

## Revisie (nov 2026)
- Geen "Fresch" meer in voice-over, ondertitels of beeld: overal "STOCK Haarlem XL". Body-voice-overs `b1body`/`b2body` opnieuw gemaakt met ElevenLabs eleven_v4 (zelfde voice_id; request-ID's in `provenance/b*body.json`). Hook-voice-overs ongewijzigd hergebruikt (provenance: eleven_v4).
- De AI-luchtopname "overview" (pand niet zichtbaar) is verwijderd. In plaats daarvan echte dronebeelden uit de Bronnenbibliotheek (`drone_beelden_nieuw_*`), staand uitgesneden naar 1080x1920 zonder AI-bewerking: `public/clips/drone-*.mp4`, herkomst, SHA256 van de bron en crop-instellingen in `provenance/drone/*.json`.
- Muziek (ElevenLabs music_v1, `provenance/music.json`) hergebruikt; geen geluidseffecten. Alleen harde sneden.

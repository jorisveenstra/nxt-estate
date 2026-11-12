# Elbe 23 Den Haag – {{VIDEO}}

Business Nomads, Elbe 23 (Forepark, Den Haag). Portrait 9:16, 1080x1920, 30 fps.
Compositions: {{COMP}}. Library clips in this archive: {{CLIPS}}.

## Revising
1. `npm ci` in the root (the project folder links `node_modules -> ../node_modules`).
2. Copy `public/clips/fotoNN.mp4` from another archive or the Frame.io Bronnenbibliotheek if this
   archive only holds part of them (see `public/clips/index.json`: asset id, sha256, sourceSha256,
   Veo generation id).
3. Text: `scripts/scripts.json`. New narration: `python3 scripts/maak_vo.py`. It uses ElevenLabs
   `eleven_v4` with voice `YgjXqgzBJa9op0K278OW` and caches responses in `scripts/tts-cache/`, so the
   same text is never paid for twice. Provenance (model_id, voice_id, request-id, credits) is in
   `public/vo/provenance.json`.
4. Shots, accents and CTA: `src/config.ts`. Hard cuts only, no transitions. Graphics level "a_lot"
   (at most 35% of the frame).
5. Preview: `npx remotion studio`. Build everything: `python3 scripts/assemble.py`
   (renders bodies once and hooks separately, concatenates with -c copy, then mixes the audio).

## Media and provenance
- Footage: existing ElevenLabs Veo 3.1 image-to-video clips (native 1080x1920) from the project
  Bronnenbibliotheek. They were reused, not regenerated.
- Music: ElevenLabs Music `music_v1`, instrumental, one bed per body (`public/music/bodyN.json`:
  prompt, length, song_id, request_id). Mixed under the narration with sidechain ducking.
- Sound effects: off.
- Branding: https://elbe-23-den-haag.afspraakbij.info. Font is Poppins (local files in `public/fonts`).
  Colours: olive #8A875E, cream #ECEAD8, near-black #202119, green "NU IN VERKOOP" label. The
  Business Nomads logo comes from that site.
- This archive contains no API keys, portal tokens or final renders.

# Dok Schiebroek – context voor revisies

- Opdracht (portal-job 4dc5da30…): huisstijl van https://doknederland.nl/ gebruiken; dikke uitleganimaties/graphics; géén gekke overgangen tussen de shots (alleen rustige overvloeiing van 8 frames).
- Branding: er is in het project geen website geconfigureerd en doknederland.nl was vanuit de cloudomgeving niet bereikbaar (proxy 403). Huisstijl is daarom overgenomen uit de bestaande Dok-implementatie (`../dok-zoetermeer-3`, in `src/brand.ts` + `public/logo/`): kleuren khaki/groen/oranje/blauw/crème, Montserrat (lokaal in `public/fonts/`), beeldmerk-blokjes. Controleer bij revisie tegen de live site.
- Formaat: 1080x1920 (9:16), 30 fps. 10 video's: Body1 (erfpacht-verhaal) en Body2 (stroom/netcongestie-verhaal) × hooks 1–5. Body 3 uit de scripts is niet geproduceerd (max. 10 video's per job).
- Teksten: `scripts/scripts.json`. Voice-over: `scripts/maak_vo.py` (ElevenLabs eleven_v4, stem Tijs YgjXqgzBJa9op0K278OW), timing: `scripts/lijn_uit.py` → `src/timing.json`.
- AI-clips: `scripts/ai_clips.py` (ElevenLabs Image & Video, veo-3.1-generate-001, 1080p, 8 s, 9:16, zonder audio). Startframes = 9:16-uitsnede van de bronfoto (`public/ai-bron/`). Generatie-ID's, asset-ID's, bron-SHA256 en prompts staan in `scripts/ai_clips_ledger.json`. Dubbele bronfoto's zijn gededupliceerd (13 unieke van 19 afbeeldingen).
- De eerste pogingen faalden met "prompt enhancement cannot be disabled" (niet in rekening gebracht); `enhance_prompt` wordt daarom niet meegestuurd (Veo past zelf prompt-verbetering toe).
- Clips in `public/clips/` zijn de Veo-uitvoer opnieuw gecodeerd (H.264, CRF 19, 1080x1920) om binnen de 200 MB-archiefgrens te blijven; de originele bestanden zijn opnieuw op te halen met de generatie-ID's via GET /v1/flows/video/<id>.
- Renderen lokaal: `npx remotion render Body1-Hook1 out/video.mp4` (in de projectmap, `npm install` in de root).

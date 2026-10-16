# Haarlem Business Center – bewerkbare Remotion-bron

Bevat de Remotion-compositie (9:16, 1080x1920) van één video: hook + body. Elke video bestaat uit een
`Hook<b>-<h>`-compositie en een `Body<b>`-compositie die achter elkaar worden geplakt (zie `scripts/render_all.py`),
met voice-over (ElevenLabs `eleven_v4`, stem YgjXqgzBJa9op0K278OW) en muziek (ElevenLabs `music_v1`) gemixt via ffmpeg.

- `src/` compositie, `config.ts` (clips per scène, callouts), `timing.json` (woordtiming)
- `scripts/` generatiescripts, `veo-ledger-*.json` (asset- en generation-ID's van Veo), `vo-provenance.json`, `portrait-meta.json` (bronfoto-SHA256 en crop)
- `public/clips/` native 1080x1920 Veo-clips (voor het archief opnieuw gecodeerd met CRF 18; de originele generation-ID's staan in de ledger)
- `startframes/` de 1080x1920 portret-startframes gebruikt voor image-to-video
- Letterwerk: Fivo Sans (haarlembusinesscenter.nl), kleuren bruin #845C3C, goud #cab766.
Geen geheimen opgenomen; ElevenLabs-authenticatie via omgeving/proxy.

## Revisie 2
- Body 3: "verhuurunits" expliciet benoemd (script, voice-over `eleven_v4`, callouts); alleen de Body 3-voice-over is opnieuw gegenereerd (`scripts/maak_vo_b3.py`), overige voice-overs en alle Veo-clips zijn hergebruikt.
- Audio-fix: de `loudnorm` in de mix liet het geluid in de laatste seconden (CTA) wegvallen. `scripts/render_all.py` mixt nu via een VO-WAV met vaste gain naar -16 LUFS; de muziek loopt door tot het einde met een korte fade-out.

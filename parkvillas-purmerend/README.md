# Parkvilla's Purmerend — advertentievideo's (3 bodies × 5 hooks, 1080×1920)

Ontwikkelaar: djzn ontwikkeling. Branding van djzn.nl (Rokkitt/Montserrat, zwart + oranje accent).

## Opbouw
- `scripts/scripts.json` — teksten (hooks, zinnen, CTA) per body.
- `scripts/maak_vo.py` — voice-overs, ElevenLabs **eleven_v4**, stem `YgjXqgzBJa9op0K278OW`; provenance in `scripts/vo-provenance.json`.
- `scripts/portret.py` — getrouwe 9:16-uitsneden van de projectbeelden (`bron/origineel` → `bron/portret`).
- `scripts/ai_video.py` — Veo 3.1 image-to-video (1080p, 9:16, 8 s) met grootboek `scripts/ai-ledger.json` (generation-ids).
- `scripts/maak_muziek.py` — één opgewekt instrumentaal muziekbed (ElevenLabs music_v1), gedeeld door alle video's.
- `scripts/timing.py` — `src/timing.json` (woordtiming, zinstarts, frames).
- `src/` — Remotion: `Hook-b<b>h<h>` en `Body-b<b>` segmenten, `Body<b>-Hook<h>` volledige preview.
- `scripts/render.py` — bundelt één keer, rendert body's één keer en hooks apart, plakt met `ffmpeg -c copy`,
  mixt VO + muziek (ducking, fades, -14 LUFS), controleert 1080×1920.
- `bron/manifest.json` — bronhashes, Frame.io-bibliotheek-ID's, generation-ids, VO/muziek-provenance, branding.

Alleen harde knippen tussen shots; footage full-bleed; geen geluidseffecten.

## Clips in het archief
`public/clips/` in een bron-ZIP bevat hercodeerde kopieën (zelfde 1080×1920, lagere bitrate) vanwege de
200 MB-limiet. De **onbewerkte Veo-originelen** staan in de Frame.io Bronnenbibliotheek van het project;
zie `bron/manifest.json` → `clips.<naam>.bibliotheek.motion_clip` en `motionClipSha256`.

## Opnieuw renderen
```bash
npm install            # in de repo-root; node_modules is een symlink
python3 scripts/timing.py
python3 scripts/render.py            # of: python3 scripts/render.py b2h3
npx remotion studio                  # preview
```

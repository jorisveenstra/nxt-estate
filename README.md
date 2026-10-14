# video-ads

Remotion-projecten voor advertentie- en wervingsvideo's, één map per klant. Elke video is
**hook + body + call to action**, met geanimeerde kaarten in de huisstijl van de klant, ondertitels
per woord en renderbeelden/AI-renders als achtergrond.

| Map | Klant | Video's |
|---|---|---|
| `pepperminds/` | Pepperminds | intro/outro om medewerkersvideo's |
| `groote-visscherij/` | De Groote Visscherij (IJmuiden) | 4 bodies × 3–5 hooks |
| `dok-zoetermeer-3/` | DOK Zoetermeer 3 | 3 doelgroepen × 5 hooks |
| `maartens-business/` | Maartens Business (Maartensdijk) | 3 doelgroepen × 5 hooks |
| `tampah-beach-villas/` | Tampah Beach Villas (Lombok) | 2 bodies × 5 hooks |
| `huisunie/` | Huisunie | 3 bodies, 12 video's |
| `nxt-estate/` | nxt.estate (eigen ads, kantoorunits) | V2–V4 × 3 hooks |

## Opzet

```
<project>/
  src/
    Root.tsx        compositions "Body<b>-Hook<h>"
    Video.tsx       opbouw: clips, scènes, ondertitels, audio
    scenes.tsx      de geanimeerde scènes per zin
    ui.tsx          bouwstenen (kaarten, labels, timing-helpers)
    brand.ts        kleuren en fonts van de klant
    config.ts       welke clip bij welke hook/scène, accentwoorden
    timing.json     gegenereerd: begin/eind per woord en scène
    clips.json      gegenereerd: lengte per clip
  scripts/
    scripts.json    teksten: hooks + zinnen per scène
    lijn_uit.py     legt de scripttekst over de woordtiming -> src/timing.json
    maak_vo.py      (waar aanwezig) maakt de voice-overs via ElevenLabs
  public/           logo's (in git) + clips, vo, muziek (niet in git)
```

Werkwijze per project:

1. Teksten in `scripts/scripts.json`.
2. Voice-over: `python3 scripts/maak_vo.py` (ElevenLabs TTS met woordtiming), of aangeleverde
   opnames + transcriptie.
3. Timing: `python3 scripts/lijn_uit.py` → `src/timing.json`.
4. Clips per scène kiezen in `src/config.ts`.
5. Bekijken: `npx remotion studio` in de projectmap. Renderen: zie `package.json` van het project,
   bijvoorbeeld `npx remotion render Body1-Hook1 out/video.mp4`.

## Installatie

```bash
npm install          # in de root; elke projectmap verwijst met een symlink naar ../node_modules
```

Python 3 en ffmpeg/ffprobe moeten in het PATH staan.

## Sleutels

ElevenLabs (voice-overs, spraak-naar-tekst, muziek en Veo-video) leest de sleutel uit `~/.elevenlabs`:

```
ELEVENLABS_API_KEY=...
```

Zet nooit sleutels in deze repo.

## Media

Clips, voice-overs, AI-renders, muziek en gerenderde video's staan **niet** in git (zie `.gitignore`).
Ze staan per project in `public/clips`, `public/vo`, `public/muziek`, `ai-renders/` en `out/`.
Zonder die bestanden kun je de code bekijken, maar niet renderen.

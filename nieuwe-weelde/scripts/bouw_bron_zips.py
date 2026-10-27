"""Bouwt per video een bewerkbare bron-ZIP (Remotion-project + media + context voor een latere revisie).

Bevat: src/, scripts/ (zonder tts-audio), package.json, package-lock.json, tsconfig, remotion.config.ts, logo's,
de voice-over van déze video (hook + body), de muziekstem + instellingen, de gebruikte (lichte) clips, de portretstartfoto's,
generatie-ID's/hashes (gen-ledger zonder gesigneerde URL's) en REVISIE.md. Geen node_modules, .git, .env, sleutels of tokens,
en niet de gerenderde MP4's. De clips in de ZIP zijn lichte kopieën (CRF 28); de volledige originelen staan in de Frame.io-bronnenbibliotheek.
"""
import hashlib
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out/zips"
SCRIPTS = json.loads((ROOT / "scripts/scripts.json").read_text())
TIMING = json.loads((ROOT / "src/timing.json").read_text())
LEDGER = json.loads((ROOT / "scripts/gen-ledger.json").read_text())
PORTRET = json.loads((ROOT / "public/portret/portret.json").read_text())


def clips_van(b, h):
    d = SCRIPTS[f"b{b}"]
    s = {c for c, _ in d["hooks"][h - 1]["clips"]}
    for z in d["zinnen"]:
        s |= {c for c, _ in z["clips"]}
    s.add(d["cta"]["clip"])
    return sorted(s)


def schoon_ledger(names):
    uit = {}
    for n in names:
        v = {k: x for k, x in LEDGER[n].items() if k not in ("asset_response", "flow_response")}
        v["bron_sha256"] = hashlib.sha256((ROOT / "public/bron" / PORTRET[n]["bron"]).read_bytes()).hexdigest()
        v["portret_sha256"] = hashlib.sha256((ROOT / f"public/portret/{n}.png").read_bytes()).hexdigest()
        v["portret_crop"] = PORTRET[n]
        uit[n] = v
    return uit


def provenance():
    p = []
    for f in sorted((ROOT / "scripts/tts-cache").glob("*.json")):
        d = json.loads(f.read_text())
        pr = d.get("_provenance")
        if pr:
            p.append({"cache": f.stem, **pr})
    return p


REVISIE = """# Revisie-instructies (Nieuwe Weelde, {naam})

Bewerkbaar Remotion-project. Compositions: `Body{b}` (body + CTA) en `Hook{b}-{h}`; de definitieve video is Hook + Body met een harde cut
(`scripts/render_alles.py` toont de volledige keten: render, concat -c copy, audiomix met ducking).
- Teksten, clips per zin, callouts: `scripts/scripts.json`; timing per woord: `src/timing.json`.
- Voice-over: ElevenLabs model `eleven_v4`, stem `YgjXqgzBJa9op0K278OW` (zie `bron/tts-provenance.json`); alleen hergebruiken met deze provenance.
- Muziek: `public/muziek/` (ElevenLabs Music `music_v1`, instrumentaal; instellingen + song-id in `muziek-instellingen.json`).
- Clips: lichte kopieën in `public/clips/`; volledige 1080x1920-originelen + generatie-ID's (`bron/gen-ledger.json`) staan in de Frame.io-bronnenbibliotheek van het project.
- Beeldformaat altijd 9:16 (1080x1920), alleen harde cuts, footage full-bleed, graphics-niveau "a_lot" (max 35% van het beeld).
- Branding: salie-groen #6c887a, zand #d4c6af, goud (Goud Wonenconcept), logo's in `public/`; bron: https://aanbod.vorm.nl/nieuweweelde.
"""


def bouw(b, h):
    n = f"Body-{b}-Hook-{h}"
    d = SCRIPTS[f"b{b}"]
    clips = clips_van(b, h)
    OUT.mkdir(parents=True, exist_ok=True)
    pad = OUT / f"{n}-bron.zip"
    ctx = {"project": "Nieuwe Weelde (Hoorn)", "doelgroep": d["doelgroep"], "body": b, "hook": h, "hook_tekst": d["hooks"][h - 1]["t"], "scripts": d,
           "uitvoer": {"breedte": 1080, "hoogte": 1920, "fps": 30}, "productie": {"voiceover": "eleven_v4", "muziek": "music_v1", "beeld": "veo-3.1-generate-001 9:16 1080p"}}
    with zipfile.ZipFile(pad, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted((ROOT / "src").iterdir()):
            z.write(f, f"src/{f.name}")
        for f in sorted((ROOT / "scripts").iterdir()):
            if f.is_file() and f.name != "gen-ledger.json":
                z.write(f, f"scripts/{f.name}")
        for f in ["package.json", "tsconfig.json", "remotion.config.ts"]:
            z.write(ROOT / f, f)
        z.write(ROOT.parent / "package-lock.json", "package-lock.json")
        for f in ["logo-groen.png", "logo-wit.png", "goud-logo.png"]:
            z.write(ROOT / "public" / f, f"public/{f}")
        z.write(ROOT / f"public/vo/hook{b}-{h}.wav", f"public/vo/hook{b}-{h}.wav")
        z.write(ROOT / f"public/vo/body{b}.wav", f"public/vo/body{b}.wav")
        for f in (ROOT / "public/muziek").iterdir():
            z.write(f, f"public/muziek/{f.name}")
        for c in clips:
            z.write(ROOT / f"public/clips-arch/{c}.mp4", f"public/clips/{c}.mp4")
            z.write(ROOT / f"public/portret/{c}.png", f"public/portret/{c}.png")
        z.writestr("bron/gen-ledger.json", json.dumps(schoon_ledger(clips), indent=1, ensure_ascii=False))
        z.writestr("bron/tts-provenance.json", json.dumps(provenance(), indent=1, ensure_ascii=False))
        z.writestr("bron/context.json", json.dumps(ctx, indent=1, ensure_ascii=False))
        z.writestr("REVISIE.md", REVISIE.format(naam=n, b=b, h=h))
    return pad


if __name__ == "__main__":
    for b in [1, 2, 3]:
        for h in range(1, 6):
            p = bouw(b, h)
            print(p.name, round(p.stat().st_size / 1e6, 1), "MB")

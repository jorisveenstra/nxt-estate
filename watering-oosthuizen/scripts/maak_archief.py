"""
Maakt per video een bewerkbaar bronarchief (ZIP, max 200 MB): Remotion-bron, scripts, package.json + lockfile,
lettertypen/logo, voice-overs van die video (+ TTS-provenance), muziekstem + instellingen, de gebruikte clips
(compacte 30 fps-kopieën uit out/archief-clips), de staande startbeelden en het generatie-/bibliotheekregister.
De originele Veo-clips (± 32 MB per stuk) staan in de Frame.io-bronnenbibliotheek; zie bronnen/bibliotheek-ids.json.
Geen node_modules, .git, .env, sleutels, portal-tokens of gerenderde eind-MP4's.

Gebruik: python3 scripts/maak_archief.py <body> <hook> <uitvoer.zip>
"""
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERBODEN = re.compile(r"(\.env|token|secret|credential|\.nxt-usage|\.nxt-media)", re.I)


def main():
    b, h, uit = int(sys.argv[1]), int(sys.argv[2]), Path(sys.argv[3])
    cfg = (ROOT / "src/config.ts").read_text()
    # clips van deze body (BODY_SHOTS-blok) en deze hook
    body_blok = re.search(rf"\n  {b}: \[(.*?)\n  \],", cfg, re.S).group(1)
    hook_blok = re.search(rf"\n  {b}: \{{(.*?)\}},\n", cfg).group(1)
    hook_clips = re.search(rf"\b{h}: \[(.*?)\]", hook_blok).group(1)
    clips = sorted(set(re.findall(r"src\d\d", body_blok + hook_clips)))
    bestanden = []
    for p in ["package.json", "remotion.config.ts", "tsconfig.json", ".gitignore"]:
        bestanden.append((ROOT / p, p))
    bestanden.append((ROOT.parent / "package-lock.json", "package-lock.json"))
    for p in sorted((ROOT / "src").glob("*")) + sorted((ROOT / "scripts").glob("*.py")) + sorted((ROOT / "scripts").glob("*.json")) + sorted((ROOT / "scripts").glob("*.sh")):
        bestanden.append((p, str(p.relative_to(ROOT))))
    for p in sorted((ROOT / "scripts/tts-cache").glob("*")):
        bestanden.append((p, str(p.relative_to(ROOT))))
    for p in ["public/fonts/JosefinSans.woff2", "public/fonts/Merriweather.woff2", "public/logo-watering.png",
              "public/music/muziek.mp3", "public/music/muziek.json", f"public/vo/b{b}.wav", f"public/vo/b{b}h{h}.wav",
              "bronnen/ai-clips/generaties.json", "bronnen/bibliotheek-ids.json", "BRONNEN.md"]:
        bestanden.append((ROOT / p, p))
    for c in clips:
        bestanden.append((ROOT / "out/archief-clips" / f"{c}.mp4", f"public/clips/{c}.mp4"))
        bestanden.append((ROOT / "bronnen/portret" / f"{c}-9x16.jpg", f"bronnen/portret/{c}-9x16.jpg"))
    with zipfile.ZipFile(uit, "w", zipfile.ZIP_DEFLATED) as z:
        for src, naam in bestanden:
            if VERBODEN.search(naam) or not src.exists():
                if not src.exists():
                    raise SystemExit(f"ontbreekt: {src}")
                continue
            z.write(src, f"watering-oosthuizen/{naam}")
        z.writestr("watering-oosthuizen/VIDEO.json", json.dumps({"body": b, "hook": h, "composition": f"Body{b}-Hook{h}",
                                                                 "clips": clips, "formaat": "1080x1920, 30 fps"}, indent=1))
    mb = uit.stat().st_size / 1e6
    assert mb < 200, mb
    print(uit.name, f"{mb:.1f} MB", len(clips), "clips")


if __name__ == "__main__":
    main()

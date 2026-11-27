"""
Bewerkbaar bronarchief per video (Remotion-bron, package.json, lockfile, stem, muziek, nieuw gegenereerde clips,
timing en herkomst). Hergebruikte bibliotheekclips staan als verwijzing (asset-ID + sha256) in scripts/bronnen.json
en zijn terug te halen met scripts/haal_clips.py. Geen node_modules, .git, out/, renders, sleutels of tokens.

Gebruik: python3 scripts/maak_bronzip.py B H uit.zip
"""
import json, re, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIMIT = 200_000_000


def main():
    b, h, uit = int(sys.argv[1]), int(sys.argv[2]), Path(sys.argv[3])
    cfg = (ROOT / "src/config.ts").read_text()
    # clips die deze video gebruikt
    blok = cfg[cfg.index(f"  {b}: {{", cfg.index("SCENE_CLIPS")):]
    blok = blok[: blok.index("\n  },")]
    hook = re.search(rf"\n  {b}: \{{([^}}]*)\}}", cfg[cfg.index("HOOK_CLIPS"):]).group(1)
    hook_clip = re.search(rf"{h}: \"([^\"]+)\"", hook).group(1)
    gebruikt = sorted(set(re.findall(r'"([a-z0-9-]+)"', blok)) | {hook_clip})
    bron = json.loads((ROOT / "scripts/bronnen.json").read_text())["clips"]
    files = []
    for p in ["README.md", "package.json", "remotion.config.ts", "tsconfig.json"]:
        files.append((ROOT / p, p))
    files.append((ROOT.parent / "package-lock.json", "package-lock.json"))
    files.append((ROOT.parent / "package.json", "root-package.json"))
    for p in sorted((ROOT / "src").glob("*")) + sorted((ROOT / "scripts").glob("*.py")) + sorted((ROOT / "scripts").glob("*.json")):
        files.append((p, str(p.relative_to(ROOT))))
    for p in sorted((ROOT / "scripts/tts-cache").glob("*")):
        if p.suffix in (".json", ".mp3"):
            files.append((p, str(p.relative_to(ROOT))))
    for p in sorted((ROOT / "public/fonts").glob("*")) + sorted((ROOT / "public/logo").glob("*")):
        files.append((p, str(p.relative_to(ROOT))))
    for p in [f"public/vo/b{b}-body.wav", f"public/vo/b{b}h{h}-hook.wav", f"public/muziek/b{b}.mp3", f"public/muziek/b{b}.meta.json"]:
        files.append((ROOT / p, p))
    for c in gebruikt:
        if "motionClip" in bron[c]:  # nieuw in deze batch: origineel meeleveren
            files.append((ROOT / f"public/clips/{c}.mp4", f"public/clips/{c}.mp4"))
    info = {"video": f"Body {b} Hook {h}", "composition": f"Body{b}-Hook{h}", "clips": gebruikt,
            "clipsNietInZip": [c for c in gebruikt if "motionClip" not in bron[c]],
            "opmerking": "Hergebruikte clips: ophalen uit de Frame.io-bronnenbibliotheek via scripts/haal_clips.py (sha256 in scripts/bronnen.json)."}
    verboden = re.compile(r"(\.env|node_modules|\.git/|credentials|\.nxt-)")
    with zipfile.ZipFile(uit, "w", zipfile.ZIP_DEFLATED) as z:
        for src, naam in files:
            if verboden.search(naam):
                continue
            z.write(src, f"haarlem-business-center/{naam}")
        z.writestr("haarlem-business-center/VIDEO.json", json.dumps(info, ensure_ascii=False, indent=1))
    size = uit.stat().st_size
    if size > LIMIT:
        sys.exit(f"ZIP te groot: {size}")
    print(uit, size)


if __name__ == "__main__":
    main()

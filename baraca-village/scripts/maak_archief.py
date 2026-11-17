"""
Maakt per video een bewerkbaar bronarchief (ZIP, max 200 MB): de volledige Remotion-bron, lockfile,
voice-overs (met eleven_v4-herkomst), muziek- en geluidsstems met generatie-instellingen, clips,
Veo-originelen met generatie-ID's, staande startbeelden, bronmanifest en de eigen audiomix.
Geen node_modules, .git, .env, sleutels, portal-tokens of gerenderde eind-MP4's.

Gebruik: python3 scripts/maak_archief.py <b1_h1> <uit.zip> [map-met-archiefclips]
"""
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = ROOT.parent
SKIP_DIRS = {"__pycache__", "node_modules", "out", "tts-cache", "receipts", ".git", "mix", "clips", "bronnen"}
VERBODEN = (".env", ".pending")


def main():
    key, uit = sys.argv[1], Path(sys.argv[2])
    clipmap = Path(sys.argv[3]) if len(sys.argv) > 3 else ROOT / "public/clips"
    with zipfile.ZipFile(uit, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        def add(p, arc):
            if p.is_symlink() or p.name.endswith(VERBODEN) or p.name.startswith(".nxt-"):
                return
            z.write(p, arc)
        for p in sorted(ROOT.rglob("*")):
            rel = p.relative_to(ROOT)
            if p.is_dir() or any(part in SKIP_DIRS for part in rel.parts) or p.is_symlink():
                continue
            add(p, f"baraca-village/{rel}")
        for p in sorted((ROOT / "media/bronnen").glob("*.png")):
            add(p, f"baraca-village/media/bronnen/{p.name}")
        for p in sorted(clipmap.glob("*.mp4")):
            add(p, f"baraca-village/public/clips/{p.name}")
        add(ROOT / f"public/mix/{key}.wav", f"baraca-village/public/mix/{key}.wav")
        add(REPO / "package.json", "package.json")
        add(REPO / "package-lock.json", "package-lock.json")
        z.writestr("baraca-village/VARIANT.txt", f"Deze export: {key} -> composition Body{key[1]}-Hook{key.split('_h')[1]}\n")
    print(uit, round(uit.stat().st_size / 1e6, 1), "MB")


if __name__ == "__main__":
    main()

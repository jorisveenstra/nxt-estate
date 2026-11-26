"""
Zet public/clips/ terug uit de Frame.io-bronnenbibliotheek van het project (bijv. bij een revisie).
Invoer: een JSON-lijst met bibliotheek-assets (snapshot.mediaLibrary.assets uit de portal-claim), met downloadUrl.
Elke download wordt gecontroleerd op de sha256 uit scripts/bronnen.json en op 1080x1920.

Gebruik: python3 scripts/haal_clips.py library.json
"""
import hashlib, json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    lib = json.loads(Path(sys.argv[1]).read_text())
    lib = lib.get("assets", lib) if isinstance(lib, dict) else lib
    by_id = {a["id"]: a for a in lib}
    bron = json.loads((ROOT / "scripts/bronnen.json").read_text())["clips"]
    out = ROOT / "public/clips"; out.mkdir(parents=True, exist_ok=True)
    for name, c in bron.items():
        aid = c.get("libraryAssetId") or c["motionClip"]["libraryAssetId"]
        sha = c.get("sha256") or c["motionClip"]["sha256"]
        dst = out / f"{name}.mp4"
        if dst.exists() and hashlib.sha256(dst.read_bytes()).hexdigest() == sha:
            continue
        a = by_id.get(aid)
        if not a or not a.get("available") or a.get("archived"):
            sys.exit(f"Clip {name} ({aid}) ontbreekt of is gearchiveerd in de bibliotheek")
        subprocess.run(["curl", "-sS", "--fail", "-o", str(dst), a["downloadUrl"]], check=True)
        if hashlib.sha256(dst.read_bytes()).hexdigest() != sha:
            sys.exit(f"sha256 klopt niet voor {name}")
        print("opgehaald", name)


if __name__ == "__main__":
    main()

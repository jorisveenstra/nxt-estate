"""
Bewaart de staande startbeelden (portrait_image) en de Veo-clips (motion_clip) in de
Bronnenbibliotheek van het project (Frame.io) via portal_bridge.save_library_asset.
De originele renders staan al als bron in Frame.io en worden niet opnieuw geüpload.

Draai vanuit een map waar de bridge-receipts mogen staan, met NXT_BRIDGE_DIR (b.py met de bridge).
Resultaat: scripts/bibliotheek-ids.json (asset-id's per bestand, geen tokens of URL's).
"""
import hashlib, json, os, shutil, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, os.environ["NXT_BRIDGE_DIR"])
import b

PROJECT = "Kennedylaan Heerenveen"


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def main():
    shots = json.loads((ROOT / "scripts/shots.json").read_text())
    meta = json.loads((ROOT / "scripts/bibliotheek.json").read_text())
    veo = json.loads((ROOT / "scripts/veo-ledger.json").read_text())
    src_index = {x["file"]: x for x in json.loads(Path(os.environ["NXT_SRC_INDEX"]).read_text())}
    ids_path = ROOT / "scripts/bibliotheek-ids.json"
    ids = json.loads(ids_path.read_text()) if ids_path.exists() else {}
    br = b.bridge()
    br.library_assets = br.library().get("assets", [])
    tmp = Path(tempfile.mkdtemp())
    for shot, L in veo.items():
        if L.get("status") != "completed":
            continue
        clip = ROOT / f"public/clips/{shot}.mp4"
        start = ROOT / f"bronnen/staand/{shot}.png"
        m, s = meta[shot], shots[shot]
        orig_sha = src_index[s["src"]]["sha"]
        items = [
            ("portrait_image", start, f"{PROJECT} - {m['naam']} - staande uitsnede (startbeeld) - {m['licht']} - 9x16", ".png",
             f"Staande 1080x1920 uitsnede (zonder outpainting) van verkoopbrochure-{s['label']}. {m['zichtbaar']} "
             f"Gebruik: startbeeld voor image-to-video; {m['gebruik']}", orig_sha, None),
            ("motion_clip", clip, f"{PROJECT} - {m['naam']} - {m['beweging']} - {m['licht']} - 9x16", ".mp4",
             f"Veo 3.1 image-to-video (8 s, 1080x1920, zonder audio) vanaf het staande startbeeld van {s['label']}. "
             f"{m['zichtbaar']} Geschikt voor: {m['gebruik']}", sha(start), L["generation_id"]),
        ]
        for kind, path, title, ext, desc, src_sha, gen in items:
            key = f"{shot}:{kind}"
            if ids.get(key, {}).get("done"):
                continue
            named = tmp / (title.replace("/", "-") + ext)
            shutil.copyfile(path, named)
            asset_id = ids.get(key, {}).get("asset_id")
            if not asset_id:
                import uuid
                asset_id = str(uuid.uuid4())
                ids[key] = {"asset_id": asset_id, "title": title, "sha256": sha(path)}
                ids_path.write_text(json.dumps(ids, indent=1, ensure_ascii=False))
            tags = ["kennedylaan", "heerenveen", "9x16", kind] + m["tags"]
            res = br.save_library_asset(str(named), title, desc, tags, kind, source_sha256=src_sha,
                                        generation_id=gen, asset_id=asset_id)
            ids[key].update(done=True, library_id=res.get("id"), available=res.get("available"))
            ids_path.write_text(json.dumps(ids, indent=1, ensure_ascii=False))
            print(key, "->", res.get("id"), res.get("available"), flush=True)


if __name__ == "__main__":
    main()

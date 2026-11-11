"""Downloadt de bronbestanden uit de portal-snapshot (claim.json, pad als argument) naar public/bron/."""
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
snap = json.load(open(sys.argv[1]))["snapshot"]
uit = ROOT / "public/bron"
uit.mkdir(parents=True, exist_ok=True)
for f in snap["files"]:
    p = uit / f["name"].replace(" ", "_")
    try:
        urllib.request.urlretrieve(f["url"], p)
    except Exception as e:  # noqa: BLE001
        print("FOUT", f["name"], e)
print(sorted(x.name for x in uit.iterdir()))

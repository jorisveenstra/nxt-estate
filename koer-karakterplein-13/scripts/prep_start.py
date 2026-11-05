"""Portret-startbeelden 1080x1920: onderwerp-bewuste 9:16-uitsnede (geen verzonnen architectuur), daarna opschalen."""
import json, hashlib
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
SRC = Path("/tmp/claude-0/work/src")
shots = json.load(open(ROOT / "scripts/shots.json"))
out = {}
for k, s in shots.items():
    if s.get("skip"): continue
    p = SRC / s["file"]
    im = Image.open(p).convert("RGB")
    w, h = im.size
    cw = round(h * 9 / 16)
    x0 = min(max(round(s["cx"] * w - cw / 2), 0), w - cw)
    im = im.crop((x0, 0, x0 + cw, h)).resize((1080, 1920), Image.LANCZOS)
    dst = ROOT / "start" / f"{k}.jpg"
    im.save(dst, quality=93)
    out[k] = {"source": s["file"], "source_sha256": hashlib.sha256(p.read_bytes()).hexdigest(), "start_sha256": hashlib.sha256(dst.read_bytes()).hexdigest()}
json.dump(out, open(ROOT / "scripts/start_hashes.json", "w"), indent=1)
print(len(out), "startbeelden")

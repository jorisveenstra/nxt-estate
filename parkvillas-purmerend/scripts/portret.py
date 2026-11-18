"""Maakt faithful 9:16 portretuitsneden (1080x1920) van de projectfoto's: alleen bijsnijden en schalen,
geen outpainting of wijziging aan de architectuur. Middelpunt per foto (fractie van de breedte) hieronder."""
import json, subprocess, hashlib
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
CROPS = {  # slug: (bronbestand, x-middelpunt)
    "voorgevel-park": ("voorkant.jpg", 0.50),
    "achtergevel-terras": ("achterkant hoog.jpg", 0.46),
    "achtergevel-straat": ("achterkant laag.jpg", 0.30),
    "stadstuin": ("tuin.jpg", 0.45),
    "woonkamer": ("woonkamer_parkvilla.jpg", 0.47),
    "keuken": ("Naamloos-1_0001_1189_LivingKitchen_15_12_2025_Final_Cam_2-3-3-1920x1080.jpg", 0.40),
    "loft-studio": ("Pilates.jpg", 0.50),
    "slaapkamer": ("slaapkamer met bad.jpg", 0.45),
    "park-vijver": ("Foto van park.jpg", 0.50),
    "park-wandelpad": ("Foto van park 2.jpg", 0.25),
    "park-wandelaars": ("Foto van park 4.jpg", 0.66),
}
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
meta = {}
for slug, (fn, cx) in CROPS.items():
    src = ROOT / "bron/origineel" / fn
    w, h = map(int, subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(src)], capture_output=True, text=True).stdout.strip().split(","))
    cw = round(h * 9 / 16 / 2) * 2
    x = min(max(0, round(cx * w - cw / 2)), w - cw)
    out = ROOT / f"bron/portret/{slug}.jpg"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vf", f"crop={cw}:{h}:{x}:0,scale=1080:1920:flags=lanczos,setsar=1", "-q:v", "2", str(out)], check=True)
    meta[slug] = {"bron": fn, "bronSha256": sha(src), "crop": [cw, h, x, 0], "portretSha256": sha(out)}
(ROOT / "bron/portret.json").write_text(json.dumps(meta, indent=1, ensure_ascii=False))

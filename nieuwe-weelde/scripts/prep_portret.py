"""Maakt per gekozen bronfoto een echte 1080x1920 portret-startfoto (onderwerp-bewuste crop op volle hoogte + Lanczos-schaling).
Geen architectuur verzonnen of veranderd: alleen een uitsnede."""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# naam: (bronbestand, x-midden als fractie van de breedte)
FOTOS = {
    "gevel-zomer": ("2442_ext_00-SURREND3R.jpg", 0.50),
    "gracht-zon": ("Nieuwe_Weelde_2.png", 0.60),
    "gracht-hoek": ("2442_ext_22-SURREND3R.jpg", 0.66),
    "park-pad": ("visual_01_2442_ext_cloud-0025.jpg", 0.55),
    "daktuin": ("visual_02_0075_SURREND3R.jpg", 0.27),
    "woonkamer-man": ("Nieuwe_Weelde_1.png", 0.45),
    "buurtkamer": ("visual_05.03_SURREND3R_-_Buurtkamer.jpg", 0.40),
    "woonkamer-b": ("visual_06_SURREND3R_-_Type_B.jpg", 0.55),
    "balkon-c": ("visual_08_SURREND3R_-_Type_C.jpg", 0.66),
    "luchtfoto-wijk": ("visual_10_2442_ext_45.jpg", 0.58),
    "luchtfoto-hoorn": ("visual_09_2442_ext_35.jpg", 0.55),
}
meta = {}
for naam, (bron, cx) in FOTOS.items():
    p = ROOT / "public/bron" / bron
    w, h = map(int, subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", str(p)], text=True).strip().split("x"))
    cw = round(h * 9 / 16)
    x = max(0, min(w - cw, round(cx * w - cw / 2)))
    uit = ROOT / f"public/portret/{naam}.png"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(p), "-vf", f"crop={cw}:{h}:{x}:0,scale=1080:1920:flags=lanczos,format=rgb24", str(uit)], check=True)
    meta[naam] = {"bron": bron, "bronAfmeting": [w, h], "crop": [x, 0, cw, h]}
    print(naam, w, h, x, cw)
(ROOT / "public/portret/portret.json").write_text(json.dumps(meta, indent=1, ensure_ascii=False))

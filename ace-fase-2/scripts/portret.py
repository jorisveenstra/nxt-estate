"""Bereidt 1080x1920 portret-startframes voor: onderwerp-bewuste crop (geen verzonnen architectuur)."""
import json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
BRON = Path(sys.argv[1])  # map met originelen
# slug -> (bestand, x-midden als fractie van de breedte, y-midden als fractie van de hoogte)
FOTOS = {
    "padelbanen-toren": ("202406_ACE_Exterieur 02_HR.jpg", 0.40, 0.5),
    "waterpartij-toren": ("202406_ACE_Exterieur 04_HR.jpg", 0.55, 0.5),
    "toren-schemering": ("202406_ACE_Exterieur 06_HR.jpg", 0.50, 0.5),
    "vogelvlucht": ("202406_ACE_Vogelvlucht 1_HR.jpg", 0.50, 0.5),
    "gracht-zonsondergang": ("Exterieur 09 v2_HR.jpg", 0.40, 0.5),
    "wandelpad-bewoners": ("Exterieur 14 v2_HR.jpg", 0.50, 0.5),
    "park-gracht-gebouw": ("Exterieur 08_W1-2.jpg", 0.50, 0.5),
    "balkons-gracht": ("Exterieur 05_W1-2.jpg", 0.42, 0.5),
    "cafe-plint-terras": ("Exterieur 09_W1-2.jpg", 0.55, 0.5),
    "terras-eettafel": ("Liftado_Urban_Villa_Terras_HR.jpg", 0.55, 0.5),
    "penthouse-woonkamer": ("Liftado_Urban_Penthouse_view_2_HR.jpg", 0.50, 0.5),
    "woonkamer-oranje-bank": ("Cortado_Urban_85_HR.jpg", 0.40, 0.5),
    "maisonnette-keuken-trap": ("Cortado_Urban_Villa_view_2_HR.jpg", 0.55, 0.5),
    "appartement-50m2": ("Liftado_Waterfront_50_HR.jpg", 0.50, 0.5),
}
if __name__ == "__main__":
    for slug, (f, cx, cy) in FOTOS.items():
        src = BRON / f
        w, h = map(int, subprocess.check_output(["identify", "-format", "%w %h", str(src)]).split())
        cw, ch = (round(h * 9 / 16), h) if w / h > 9 / 16 else (w, round(w * 16 / 9))
        x = min(max(round(w * cx - cw / 2), 0), w - cw)
        y = min(max(round(h * cy - ch / 2), 0), h - ch)
        uit = ROOT / "ai-renders/portret" / f"{slug}.jpg"
        subprocess.run(["convert", str(src), "-crop", f"{cw}x{ch}+{x}+{y}", "+repage", "-resize", "1080x1920!", "-quality", "93", str(uit)], check=True)
        print(slug, f"crop {cw}x{ch}+{x}+{y} uit {w}x{h}")

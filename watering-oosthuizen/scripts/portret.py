"""Maakt per bronrender een staande 1080x1920-startfoto (architectuurgetrouwe uitsnede, geen uitbreiding/vervorming).
CENTRUM = horizontale (en voor staande bronnen verticale) middelpunt van de uitsnede als fractie van de breedte."""
import subprocess, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
CENTRUM = {"src01": .56, "src02": .45, "src03": .55, "src05": .62, "src06": .60, "src07": .42, "src08": .50,
           "src09": .40, "src10": .50, "src11": .50, "src12": .50, "src13": .55, "src14": .56, "src15": .42,
           "src16": .74, "src17": .30, "src18": .52, "src19": .45, "src20": .52}
def maat(p):
    w, h = map(int, subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout.strip().split(","))
    return w, h
for naam, c in CENTRUM.items():
    if len(sys.argv) > 1 and naam not in sys.argv[1:]:
        continue
    bron = ROOT / "bronnen/origineel" / f"{naam}.jpg"
    w, h = maat(bron)
    cw, ch = (h * 9 // 16, h) if w / h > 9 / 16 else (w, w * 16 // 9)
    x = min(max(0, int(c * w - cw / 2)), w - cw)
    y = (h - ch) // 2
    uit = ROOT / "bronnen/portret" / f"{naam}-9x16.jpg"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(bron), "-vf", f"crop={cw}:{ch}:{x}:{y},scale=1080:1920:flags=lanczos,setsar=1",
                    "-q:v", "2", str(uit)], check=True)
    print(naam, f"{w}x{h} -> crop {cw}x{ch}@{x},{y}")

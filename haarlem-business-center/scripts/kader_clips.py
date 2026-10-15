"""
Veo laat bij landschapsbronnen vaak zwarte balken staan in de 9:16-clip. Dit script detecteert de balken en zet de
echte beeldband scherp (op breedte 1080, niet opgerekt) midden op een vervaagde vulling van dezelfde clip.
Clips zonder balken worden alleen naar 30 fps omgezet. Gebruikt alleen ai-renders/*.mp4 (geen nieuwe generaties).
"""
import re, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
for src in sorted((ROOT / "ai-renders").glob("*.mp4")):
    out = ROOT / "public/clips" / src.name
    r = subprocess.run(["ffmpeg", "-nostdin", "-ss", "2", "-i", str(src), "-t", "4", "-vf", "cropdetect=limit=24:round=2:reset=0", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    m = re.findall(r"crop=(\d+):(\d+):(\d+):(\d+)", r)
    w, h, x, y = map(int, m[-1]) if m else (1080, 1920, 0, 0)
    bars = h < 1700
    if bars:
        h2 = round(h * 1080 / w / 2) * 2
        vf = (f"[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=28,eq=brightness=-0.12[bg];"
              f"[b]crop={w}:{h}:{x}:{y},scale=1080:{h2}:flags=lanczos[fg];[bg][fg]overlay=0:(H-h)/2,fps=30,format=yuv420p")
    else:
        vf = "fps=30,format=yuv420p"
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(src), "-filter_complex" if bars else "-vf", vf, "-an", "-c:v", "libx264",
                    "-crf", "19", "-preset", "medium", "-movflags", "+faststart", str(out)], check=True)
    print(src.name, "met balken -> vervaagde vulling" if bars else "volledig beeld", (w, h))

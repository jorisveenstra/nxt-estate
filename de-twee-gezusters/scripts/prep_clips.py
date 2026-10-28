"""Snijdt de bronclips (1920x1080, REAL) naar native portret 1080x1920 @30fps (cover-fit crop, geen rek/padding)
en kopieert de AI-clips (Veo 3.1, al 1080x1920). Gebruik: python3 scripts/prep_clips.py <bronmap> <aimap>"""
import json, shutil, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
src, ai = Path(sys.argv[1]), Path(sys.argv[2])
out = ROOT / "public/clips"; out.mkdir(parents=True, exist_ok=True)
for cid, (name, fx) in json.loads((ROOT / "scripts/clips_map.json").read_text()).items():
    x = f"min(max({fx}*iw-ih*9/32\\,0)\\,iw-ih*9/16)"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src / f"{name}.mp4"), "-an", "-vf",
        f"fps=30,crop=w=floor(ih*9/16/2)*2:h=ih:x={x}:y=0,scale=1080:1920:flags=lanczos,setsar=1",
        "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", "-g", "30", "-movflags", "+faststart",
        str(out / f"{cid}.mp4")], check=True)
for f in ai.glob("*.mp4"):
    if f.name.startswith("gen_"): continue
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(f), "-an", "-vf", "fps=30,setsar=1", "-c:v", "libx264", "-crf", "16", "-preset", "medium",
        "-pix_fmt", "yuv420p", "-g", "30", "-movflags", "+faststart", str(out / ("ai_" + f.name))], check=True)

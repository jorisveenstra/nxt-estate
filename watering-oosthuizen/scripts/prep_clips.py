"""Zet de originele Veo-clips (bronnen/ai-clips, 1080x1920, 24 fps) om naar public/clips (30 fps, korte GOP)
en schrijft src/clips.json (lengte per clip). Weigert clips die niet native 1080x1920 staand zijn."""
import json, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
lengtes = {}
for src in sorted((ROOT / "bronnen/ai-clips").glob("*.mp4")):
    info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,sample_aspect_ratio:stream_side_data=rotation:format=duration", "-of", "json", str(src)], capture_output=True, text=True).stdout)
    s = info["streams"][0]
    rot = any(d.get("rotation") for d in s.get("side_data_list", []))
    if (s["width"], s["height"]) != (1080, 1920) or rot or s.get("sample_aspect_ratio", "1:1") not in ("1:1", "N/A"):
        print("GEWEIGERD (geen native 1080x1920 staand):", src.name); continue
    uit = ROOT / "public/clips" / src.name
    if not uit.exists():
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(src), "-vf", "fps=30,format=yuv420p,setsar=1", "-an", "-c:v", "libx264",
                        "-crf", "17", "-preset", "medium", "-g", "15", "-movflags", "+faststart", str(uit)], check=True)
    lengtes[src.stem] = round(float(info["format"]["duration"]), 3)
(ROOT / "src/clips.json").write_text(json.dumps(lengtes, indent=1))
print(len(lengtes), "clips klaar")

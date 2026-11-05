"""Controleert elke gegenereerde clip (moet zelf al 1080x1920, vierkante pixels, geen rotatie zijn) en maakt de 30 fps montageversie in public/clips/ + src/clips.json."""
import json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
ORIG = ROOT / "source-assets/motion-original"
(ROOT / "public/clips").mkdir(parents=True, exist_ok=True)
lengths = {}
for f in sorted(ORIG.glob("*.mp4")):
    info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(f)], capture_output=True, text=True, check=True).stdout)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    rot = float(v.get("tags", {}).get("rotate", 0)) != 0 or any(float(s.get("rotation", 0)) != 0 for s in v.get("side_data_list", []))
    if (v["width"], v["height"]) != (1080, 1920) or rot or v.get("sample_aspect_ratio", "1:1") not in ("1:1", "N/A"):
        sys.exit(f"AFGEKEURD {f.name}: {v['width']}x{v['height']} rot={rot} sar={v.get('sample_aspect_ratio')}")
    out = ROOT / "public/clips" / f.name
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(f), "-vf", "fps=30,setsar=1,format=yuv420p", "-an", "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-g", "30", "-movflags", "+faststart", str(out)], check=True)
    lengths[f.stem] = round(float(info["format"]["duration"]), 3)
    print("ok", f.name, lengths[f.stem])
(ROOT / "src/clips.json").write_text(json.dumps(lengths, indent=1))

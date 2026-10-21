"""ai-broll/*.mp4 (originelen van de provider) -> public/clips/*.mp4 (30 fps). Weigert alles wat niet native 1080x1920 is; schrijft src/clips.json."""
import json, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
(ROOT / "public/clips").mkdir(parents=True, exist_ok=True)
lengtes = {}
for bron in sorted((ROOT / "ai-broll").glob("*.mp4")):
    st = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,sample_aspect_ratio:stream_side_data=rotation", "-of", "json", str(bron)]))["streams"][0]
    assert (st["width"], st["height"]) == (1080, 1920) and st.get("sample_aspect_ratio", "1:1") in ("1:1", "0:1") and not st.get("side_data_list"), (bron.name, st)
    uit = ROOT / "public/clips" / bron.name
    if not uit.exists():
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(bron), "-vf", "fps=30,format=yuv420p", "-an", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-movflags", "+faststart", str(uit)], check=True)
    lengtes[bron.stem] = round(float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(uit)])), 3)
    print(bron.name, lengtes[bron.stem])
(ROOT / "src/clips.json").write_text(json.dumps(lengtes, indent=1))

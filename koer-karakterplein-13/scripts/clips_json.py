import json, subprocess
from pathlib import Path
R = Path(__file__).resolve().parent.parent
d = {p.stem: round(float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(p)],capture_output=True,text=True).stdout),3) for p in sorted((R/"public/clips").glob("*.mp4"))}
(R/"src/clips.json").write_text(json.dumps(d, indent=1)); print(d)

"""scripts/woorden-tts.json + audio-duren + clip-duren -> src/timing.json (frames bij 30 fps)."""
import json, math, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
FPS, PAUZE, TAIL = 30, 0.35, 1.4
def duur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)
w = json.loads((ROOT / "scripts/woorden-tts.json").read_text())
out = {"hooks": {}, "bodies": {}, "clips": {}}
for stuk, words in w.items():
    d = duur(ROOT / f"public/vo/{stuk}.mp3")
    if stuk.startswith("hook-"):
        out["hooks"][stuk[5:]] = {"words": words, "audio": d, "frames": math.ceil((d + PAUZE) * FPS)}
    else:
        n = max(x[3] for x in words) + 1
        starts = [min(x[0] for x in words if x[3] == i) for i in range(n)]
        starts[0] = 0
        out["bodies"][stuk[5:]] = {"words": words, "audio": d, "starts": starts, "frames": math.ceil((d + TAIL) * FPS)}
for c in sorted((ROOT / "public/clips").glob("*.mp4")):
    if c.name.count(".") == 1:
        out["clips"][c.stem] = duur(c)
(ROOT / "src/timing.json").write_text(json.dumps(out, ensure_ascii=False))
print({k: v["frames"] for k, v in out["bodies"].items()}, {k: v["frames"] for k, v in out["hooks"].items()})

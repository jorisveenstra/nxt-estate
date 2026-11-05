"""woorden-tts.json + scripts.json -> src/timing.json en src/clips.json (clip-lengtes)."""
import json, subprocess, math
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
FPS, TAIL = 30, 2.4
sc = json.loads((ROOT/"scripts/scripts.json").read_text()); w = json.loads((ROOT/"scripts/woorden-tts.json").read_text())
cfg = json.loads((ROOT/"scripts/config.json").read_text())
out = {"bodies": {}, "hooks": {}}
for b, d in sc.items():
    # body-woorden zijn al relatief aan de body-start in de TTS-timing
    first = w[f"{b}h1"]; off = first["bodyStart"]
    words = [[round(s-off,3), round(e-off,3), t] for s,e,t in first["body"]]
    sentences = d["body"] + d["cta"]; scenes = []; i = 0
    assert len(sentences) == len(cfg[b]["scenes"]) + 1, b
    for k, s in enumerate(sentences):
        n = len(s.split()); ws = words[i:i+n]; i += n
        scenes.append({"id": "cta" if k == len(sentences)-1 else f"s{k+1}", "start": ws[0][0], "end": ws[-1][1], "words": [{"t": t, "s": a, "e": e} for a, e, t in ws]})
    assert i == len(words), (b, i, len(words))
    end = words[-1][1]
    out["bodies"][b] = {"scenes": scenes, "end": end, "frames": math.ceil((end+TAIL)*FPS)}
    for h in range(1, 6):
        x = w[f"{b}h{h}"]
        hw = x["hook"]; assert len(hw) == len(d["hooks"][h-1].split())
        hf = math.ceil(x["bodyStart"]*FPS)
        out["hooks"][f"{b}h{h}"] = {"words": [{"t": t, "s": a, "e": e} for a, e, t in hw], "frames": hf, "hookDur": x["hookDur"]}
json.dump(out, open(ROOT/"src/timing.json","w"), ensure_ascii=False, indent=1)
clips = {}
for p in sorted((ROOT/"public/clips").glob("*.mp4")):
    clips[p.stem] = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(p)],capture_output=True,text=True).stdout)
json.dump(clips, open(ROOT/"src/clips.json","w"), indent=1)
print({k:(v["frames"]) for k,v in out["bodies"].items()}, {k:v["frames"] for k,v in out["hooks"].items()}, clips)

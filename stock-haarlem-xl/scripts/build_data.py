"""Bouwt src/data.json uit provenance/*.json (ElevenLabs eleven_v4 alignment) en public/vo/*.mp3."""
import json, subprocess
from pathlib import Path
R = Path(__file__).resolve().parent.parent
def dur(p):
    return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(p)],capture_output=True,text=True).stdout)
def words(a):
    ch, st, en = a["characters"], a["character_start_times_seconds"], a["character_end_times_seconds"]
    out, cur = [], None
    for c, s, e in zip(ch, st, en):
        if c.isspace():
            if cur: out.append(cur); cur = None
        else:
            if cur is None: cur = {"t": c, "s": s, "e": e}
            else: cur["t"] += c; cur["e"] = e
    if cur: out.append(cur)
    return out
data = {}
for b in (1, 2):
    body = json.load(open(R/f"provenance/b{b}body.json"))
    bw = words(body["alignment"])
    for h in range(1, 6):
        hk = json.load(open(R/f"provenance/b{b}h{h}.json"))
        data[f"b{b}h{h}"] = {"hookDur": dur(R/f"public/vo/b{b}h{h}.mp3"), "bodyDur": dur(R/f"public/vo/b{b}body.mp3"),
                             "hookWords": words(hk["alignment"]), "bodyWords": bw}
json.dump(data, open(R/"src/data.json", "w"))
print("ok", len(data))

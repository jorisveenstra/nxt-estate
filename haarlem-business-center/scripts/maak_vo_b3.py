"""Revisie: alleen de Body 3-voice-over opnieuw (eleven_v4, zelfde stem) met 'verhuurunit'-formulering.
Overige voice-overs worden hergebruikt (zie vo-provenance.json). Werkt timing.json en woorden-tts.json bij."""
import json, subprocess, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import maak_vo as M
R = M.ROOT
sc = json.loads((R / "scripts/scripts.json").read_text())["b3"]
zinnen = sc["zinnen"] + [sc["cta"]]
mp3, al, rid, h = M.tts(" ".join(zinnen))
ws = M.woorden(al)
idx, n = [], 0
for z in zinnen:
    idx.append(n); n += len(z.split())
assert n == len(ws), (n, len(ws))
subprocess.run(["cp", str(mp3), str(R / "public/vo/b3-body.mp3")], check=True)
for f in ("src/timing.json", "scripts/woorden-tts.json"):
    t = json.loads((R / f).read_text())
    t["b3"].update({"body": ws, "bodyDur": M.duur(mp3), "sceneStart": [ws[i][0] for i in idx]})
    (R / f).write_text(json.dumps(t, ensure_ascii=False))
pv = json.loads((R / "scripts/vo-provenance.json").read_text())
pv["items"]["b3-body"] = {"request_id": rid, "cache": h, "revisie": 2}
(R / "scripts/vo-provenance.json").write_text(json.dumps(pv, indent=1))
print("ok", rid, M.duur(mp3), [ws[i][0] for i in idx])

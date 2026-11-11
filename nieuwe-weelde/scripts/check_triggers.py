"""Controleert dat elk callout- en clip-woord in scripts.json voorkomt in de zin/hook (zelfde normalisatie als Video.tsx)."""
import json
import re
from pathlib import Path

R = Path(__file__).resolve().parent.parent
sc = json.load(open(R / "scripts/scripts.json"))
tm = json.load(open(R / "src/timing.json"))
n = lambda s: re.sub(r'[.,?!:;"]', "", s.lower())
bad = 0
for b, d in sc.items():
    w = tm[b]["body"]["words"]
    scenes = tm[b]["body"]["scenes"]
    for i, z in enumerate(d["zinnen"]):
        ws = [n(x[2]) for x in w[scenes[i]["w0"]:scenes[i]["w1"]]]
        for c in z["co"]:
            if n(c["at"]) not in ws:
                print(b, z["id"], "callout", c["at"], ws); bad += 1
        for _, at in z["clips"][1:]:
            if n(at) not in ws:
                print(b, z["id"], "clip", at, ws); bad += 1
    for h, hk in enumerate(d["hooks"], 1):
        ws = [n(x[2]) for x in tm[b]["hooks"][str(h)]["words"]]
        for _, at in hk["clips"][1:]:
            if n(at) not in ws:
                print(b, "hook", h, "clip", at, ws); bad += 1
        for a in hk["accent"]:
            if n(a) not in ws:
                print(b, "hook", h, "accent", a, ws); bad += 1
print("fouten:", bad)

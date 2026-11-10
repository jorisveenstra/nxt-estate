"""Woordtiming (scripts/woorden-tts.json) + scripts.json -> src/timing.json en audio-lengtes. FPS 30."""
import json, pathlib, subprocess, math
R = pathlib.Path(__file__).resolve().parent.parent
UITSPRAAK = {"A+++": "A plus plus plus", "815.000": "achthonderd vijftien duizend"}
FPS, PAUZE, TAIL = 30, 0.35, 2.0
def spoken_n(w):
    for a, b in UITSPRAAK.items(): w = w.replace(a, b)
    return len(w.split())
def uitlijn(display, tw):
    out, i = [], 0
    for w in display:
        n = spoken_n(w); chunk = tw[i:i+n]; i += n
        out.append({"t": w, "s": chunk[0][0], "e": chunk[-1][1]})
    assert i == len(tw), (i, len(tw))
    return out
sc = json.loads((R/"scripts/scripts.json").read_text()); tw = json.loads((R/"scripts/woorden-tts.json").read_text()); T = {}
for b, d in sc.items():
    zinnen = [(zid, z) for zid, z in d["zinnen"]] + [("cta", d["cta"])]
    words = uitlijn(" ".join(z for _, z in zinnen).split(), tw[f"b{b}"]); k = 0; scenes = []
    for zid, z in zinnen:
        n = len(z.split()); ws = words[k:k+n]; k += n
        scenes.append({"id": zid, "start": ws[0]["s"], "end": ws[-1]["e"], "words": ws})
    T[f"b{b}"] = {"frames": math.ceil((words[-1]["e"] + TAIL) * FPS), "scenes": scenes}
    for h, hook in enumerate(d["hooks"], 1):
        hw = uitlijn(hook.split(), tw[f"b{b}h{h}"])
        T[f"b{b}h{h}"] = {"frames": math.ceil((hw[-1]["e"] + PAUZE) * FPS), "words": hw}
(R/"src/timing.json").write_text(json.dumps(T, ensure_ascii=False, indent=1)); print({k: v["frames"] for k, v in T.items()})

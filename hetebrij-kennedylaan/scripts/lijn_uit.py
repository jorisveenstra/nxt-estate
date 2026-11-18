"""
Zet de ElevenLabs-woordtiming (scripts/woorden-tts.json) + vo-meta om naar src/timing.json:
per body de zinnen (scènes) met begin/eind en de woorden, per hook de woorden en het aantal frames.
Gebruik: python3 scripts/lijn_uit.py
"""
import json, math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
STAART = 1.2  # seconden beeld na het laatste woord (eindkaart)
UITSPRAAK = {"RMW Makelaars": "R M W Makelaars"}


def spreek(t):
    for a, c in UITSPRAAK.items():
        t = t.replace(a, c)
    return t


def toon(words):
    """'R' 'M' 'W' weer samenvoegen tot 'RMW' voor de ondertitels."""
    uit, i = [], 0
    while i < len(words):
        if [w[2] for w in words[i:i + 3]] == ["R", "M", "W"]:
            uit.append([words[i][0], words[i + 2][1], "RMW"]); i += 3
        else:
            uit.append(words[i]); i += 1
    return uit


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    woorden = json.loads((ROOT / "scripts/woorden-tts.json").read_text())
    meta = json.loads((ROOT / "scripts/vo-meta.json").read_text())
    out = {}
    for b, d in scripts.items():
        w = woorden[f"b{b}"]
        zinnen = d["zinnen"] + [d["cta"]]
        scenes, i = [], 0
        for n, z in enumerate(zinnen):
            k = len(spreek(z).split())
            ws = w[i:i + k]
            assert len(ws) == k, (b, z)
            scenes.append({"id": "cta" if n == len(zinnen) - 1 else f"z{n + 1}", "text": z,
                           "start": ws[0][0], "end": ws[-1][1], "words": toon(ws)})
            i += k
        assert i == len(w), (b, i, len(w))
        dur = max(meta[f"b{b}"]["bodyDur"], scenes[-1]["end"]) + STAART
        out[f"b{b}"] = {"frames": math.ceil(dur * FPS), "audioDur": meta[f"b{b}"]["bodyDur"], "scenes": scenes}
        for h in range(1, len(d["hooks"]) + 1):
            key = f"b{b}h{h}"
            out[key] = {"frames": meta[key]["hookFrames"], "text": d["hooks"][h - 1], "words": toon(woorden[key])}
    (ROOT / "src/timing.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
    for k, v in out.items():
        print(k, v["frames"])


if __name__ == "__main__":
    main()

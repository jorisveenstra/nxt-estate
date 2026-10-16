"""Zet de TTS-woordtiming om naar src/timing.json: per body scènes (zinnen) relatief aan body-start, per hook de woorden."""
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
sys_path = str(ROOT / "scripts")
import importlib.util
spec = importlib.util.spec_from_file_location("maak_vo", ROOT / "scripts/maak_vo.py"); mv = importlib.util.module_from_spec(spec); spec.loader.exec_module(mv)
W = json.loads((ROOT / "scripts/woorden-tts.json").read_text())
S = json.loads((ROOT / "scripts/scripts.json").read_text())
FIX = [(["A", "twaalf", "en", "A", "vier"], ["A12", "en", "A4"]), (["vier", "komma", "vier", "meter"], ["4,4", "meter"])]

def fix(words):
    out, i = [], 0
    while i < len(words):
        for src, dst in FIX:
            if [re.sub(r"[.,?!]$", "", w["t"]) for w in words[i:i + len(src)]] == src:
                last = words[i + len(src) - 1]["t"]
                tail = re.search(r"[.,?!]$", last)
                span = words[i:i + len(src)]
                step = (span[-1]["e"] - span[0]["s"]) / len(dst)
                for k, d in enumerate(dst):
                    out.append({"t": d + (tail.group(0) if tail and k == len(dst) - 1 else ""), "s": round(span[0]["s"] + k * step, 3), "e": round(span[0]["s"] + (k + 1) * step, 3)})
                i += len(src); break
        else:
            out.append(words[i]); i += 1
    return out

res = {"bodies": {}, "hooks": {}}
for b, d in S.items():
    bw = [{"t": t, "s": s, "e": e} for s, e, t in W[f"{b}_body_alignment"]]
    scenes, k = [], 0
    for sid, z in d["zinnen"]:
        n = len(mv.spreektekst(z).split())
        sw = fix(bw[k:k + n]); k += n
        scenes.append({"id": sid, "start": sw[0]["s"], "end": sw[-1]["e"], "words": sw})
    assert k == len(bw), (b, k, len(bw))
    res["bodies"][b] = {"scenes": scenes, "end": scenes[-1]["end"]}
    for h, hook in enumerate(d["hooks"], start=1):
        hn = len(hook.split())
        hw = [{"t": t, "s": s, "e": e} for s, e, t in W[f"{b}h{h}"][:hn]]
        assert " ".join(w["t"] for w in hw) == hook, (b, h)
        res["hooks"][f"{b}h{h}"] = {"words": hw, "end": hw[-1]["e"]}
(ROOT / "src/timing.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
for b, v in res["bodies"].items():
    print(b, round(v["end"], 1), [(s["id"], round(s["start"], 1), round(s["end"], 1)) for s in v["scenes"]])
print({k: round(v["end"], 1) for k, v in res["hooks"].items()})

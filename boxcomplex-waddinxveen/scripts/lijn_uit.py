"""Zet de ElevenLabs-alignment om naar woord- en zintiming voor Remotion -> src/timing.json.
{weergave|uitspraak}-segmenten worden in de ondertitel als één weergavewoord getoond."""
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
SEG = re.compile(r"\{([^|}]+)\|([^}]+)\}")

def tokens(sentence):
    """[(spoken, display)] per woord/segment"""
    out, pos = [], 0
    for m in SEG.finditer(sentence):
        out += [(w, w) for w in sentence[pos:m.start()].split()]
        out.append((m.group(2), m.group(1)))
        pos = m.end()
    out += [(w, w) for w in sentence[pos:].split()]
    # leestekens direct na een segment (bv. "btw.") aan het segment plakken
    fixed = []
    for sp, d in out:
        if fixed and re.fullmatch(r"[.,?!:;]+", sp):
            psp, pd = fixed[-1]; fixed[-1] = (psp + sp, pd + sp)
        else:
            fixed.append((sp, d))
    return fixed

result = {}
for meta in sorted((ROOT / "generatie/vo").glob("*.json")):
    d = json.loads(meta.read_text())
    al = d["alignment"]; chars = "".join(al["characters"])
    st, en = al["character_start_times_seconds"], al["character_end_times_seconds"]
    assert chars == d["text"], meta.name
    words, sents, cur = [], [], 0
    for si, s in enumerate(d["sentences"]):
        s0 = None
        for sp, disp in tokens(s):
            # zoek het gesproken stuk (met spaties ertussen) vanaf cur
            idx = chars.index(sp.split()[0], cur)
            end = idx + len(sp)
            assert chars[idx:end] == sp or chars[idx:end].replace("  ", " ") == sp, (meta.name, sp, chars[idx:end])
            t0, t1 = st[idx], en[end - 1]
            words.append({"t0": round(t0, 3), "t1": round(t1, 3), "w": disp, "s": si})
            s0 = t0 if s0 is None else s0
            cur = end
        sents.append({"t0": round(s0, 3), "t1": round(words[-1]["t1"], 3)})
    result[d["name"]] = {"duur": round(en[-1], 3), "woorden": words, "zinnen": sents}
(ROOT / "src/timing.json").write_text(json.dumps(result, ensure_ascii=False))
print({k: (v["duur"], len(v["zinnen"])) for k, v in result.items()})

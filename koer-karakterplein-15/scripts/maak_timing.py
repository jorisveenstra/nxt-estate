"""Bouwt src/timing.json uit de ElevenLabs-tijdstempels (eleven_v4) in scripts/vo-cache.
Per body: woorden + zinstarts relatief aan body-start. Per hook: woorden relatief aan hook-start."""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
CACHE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "scripts/vo-cache"
SP = json.loads((ROOT / "scripts/scripts.json").read_text())
def spreek(t): return t.replace("Karakterplein 15", "Karakterplein vijftien")
def woorden(al, tekst_orig):
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur: uit.append([cur, round(s, 3), round(e, 3)])
            cur, s = "", None; continue
        if s is None: s = cs
        cur += ch; e = ce
    if cur: uit.append([cur, round(s, 3), round(e, 3)])
    # toon "15" i.p.v. "vijftien"
    for w in uit:
        if w[0].lower().strip(".,") == "vijftien": w[0] = w[0].lower().replace("vijftien", "15")
        if w[0].lower().strip(".,:") == "tweehonderdvijfentwintig": w[0] = w[0].lower().replace("tweehonderdvijfentwintig", "225")
    return uit
# Hooks zijn in deze revisie ongewijzigd: hun timing blijft uit de bestaande timing.json komen
# wanneer de vo-cache van de hooks niet aanwezig is.
OLD = json.loads((ROOT / "src/timing.json").read_text()) if (ROOT / "src/timing.json").exists() else {}
out = {}
for k, v in SP.items():
    d = json.loads((CACHE / f"{k}-body.json").read_text())
    ws = woorden(d["alignment"], "")
    zinnen = v["body"] + [v["cta"]]
    # zinstart = index van eerste woord van elke zin
    idx, n = [], 0
    for z in zinnen:
        idx.append(n); n += len(z.split())
    assert n == len(ws), (k, n, len(ws))
    out[k] = {"words": ws, "sentenceStart": [ws[i][1] for i in idx], "sentenceEnd": [ws[(idx[j + 1] if j + 1 < len(idx) else n) - 1][2] for j in range(len(idx))], "end": ws[-1][2]}
    for h in range(1, 6):
        if not (CACHE / f"{k}-h{h}.json").exists():
            out[f"{k}h{h}"] = OLD[f"{k}h{h}"]; continue
        dh = json.loads((CACHE / f"{k}-h{h}.json").read_text())
        wh = woorden(dh["alignment"], "")
        assert len(wh) == len(v["hooks"][h - 1].split()), (k, h)
        out[f"{k}h{h}"] = {"words": wh, "end": wh[-1][2]}
(ROOT / "src/timing.json").write_text(json.dumps(out, ensure_ascii=False))
print("ok", {k: round(x["end"], 1) for k, x in out.items()})

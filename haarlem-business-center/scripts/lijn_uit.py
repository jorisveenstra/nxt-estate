"""
Legt de scripttekst (scripts/scripts.json) over de woordtiming van scripts/woorden-tts.json (ElevenLabs).
Schrijft src/timing.json: per body de scènes (zin) met woordtijden relatief aan de start van de body,
en per hook de woordtijden. Gebruik: python3 scripts/lijn_uit.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
tts = json.loads((ROOT / "scripts/woorden-tts.json").read_text())

uit = {"pauze": tts["pauze"], "bodies": {}, "hooks": {}}
for b, data in scripts.items():
    w = tts["body"][b]["words"]
    scenes, i = [], 0
    for sid, tekst in data["zinnen"]:
        toks = tekst.split()
        seg = w[i:i + len(toks)]
        assert len(seg) == len(toks), (b, sid)
        scenes.append({"id": sid, "start": seg[0][0], "end": seg[-1][1],
                       "words": [{"t": t, "s": s[0], "e": s[1]} for t, s in zip(toks, seg)]})
        i += len(toks)
    assert i == len(w), (b, i, len(w))
    uit["bodies"][b] = {"scenes": scenes, "duur": tts["body"][b]["duur"]}
    for h, hook in enumerate(data["hooks"], start=1):
        hw, toks = tts["hook"][f"{b}h{h}"]["words"], hook.split()
        assert len(hw) == len(toks), (b, h)
        uit["hooks"][f"{b}h{h}"] = {"duur": tts["hook"][f"{b}h{h}"]["duur"],
                                    "words": [{"t": t, "s": s[0], "e": s[1]} for t, s in zip(toks, hw)]}
(ROOT / "src/timing.json").write_text(json.dumps(uit, ensure_ascii=False, indent=1))
for b, d in uit["bodies"].items():
    print(b, round(d["duur"], 1), [(s["id"], round(s["start"], 1), round(s["end"], 1)) for s in d["scenes"]])

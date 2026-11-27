"""
Zet scripts/woorden-tts.json (woordtiming van ElevenLabs) om naar src/timing.json:
per body de zinnen (scènes) met woorden, per hook de woorden. Ondertitels tonen schrijfwijze
(88, A+++, €484.950) terwijl de stem het uitgeschreven woord uitspreekt.

Gebruik: python3 scripts/timing.py
"""
import json
from pathlib import Path

from maak_vo import spreektekst

ROOT = Path(__file__).resolve().parent.parent

# reeks gesproken woorden -> getoonde tekst (leestekens van het laatste woord blijven staan)
WEERGAVE = [
    (["vierhonderdvierentachtigduizend", "negenhonderdvijftig", "euro"], "€484.950"),
    (["achtentachtig"], "88"),
    (["a-plus-plus-plus"], "A+++"),
]


def kaal(w):
    return w.lower().strip(".,?!:;")


def toon(words):
    uit, i = [], 0
    while i < len(words):
        for reeks, tekst in WEERGAVE:
            n = len(reeks)
            if [kaal(w["t"]) for w in words[i:i + n]] == reeks:
                last = words[i + n - 1]["t"]
                staart = last[len(last.rstrip(".,?!:;")):]
                uit.append({"t": tekst + staart, "s": words[i]["s"], "e": last and words[i + n - 1]["e"]})
                i += n
                break
        else:
            uit.append(words[i])
            i += 1
    return uit


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    tts = json.loads((ROOT / "scripts/woorden-tts.json").read_text())
    uit = {}
    for b, data in scripts.items():
        ws = [{"t": t, "s": s, "e": e} for s, e, t in tts[b]["words"]]
        scenes, i = [], 0
        for sid, zin in data["zinnen"]:
            n = len(spreektekst(zin).split())
            part = ws[i:i + n]
            assert [w["t"] for w in part] == spreektekst(zin).split(), (b, sid)
            scenes.append({"id": sid, "start": part[0]["s"], "end": part[-1]["e"], "words": toon(part)})
            i += n
        assert i == len(ws), b
        uit[b] = {"scenes": scenes, "end": scenes[-1]["end"]}
        for h, hook in enumerate(data["hooks"], start=1):
            key = f"{b}h{h}"
            hw = [{"t": t, "s": s, "e": e} for s, e, t in tts[key]["words"]]
            assert [w["t"] for w in hw] == spreektekst(hook).split(), key
            uit[key] = {"words": toon(hw), "end": hw[-1]["e"]}
        print(b, f"VO {uit[b]['end']:.1f}s:", ", ".join(f"{s['id']} {s['start']:.1f}-{s['end']:.1f}" for s in scenes))
    (ROOT / "src/timing.json").write_text(json.dumps(uit, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

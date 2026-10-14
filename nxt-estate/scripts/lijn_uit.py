"""
Legt de scripttekst (scripts/scripts.json) over de herkende woorden van faster-whisper
zodat elk scriptwoord een begin- en eindtijd krijgt. In beeld tonen we altijd de scripttekst;
de herkenning wordt alleen voor de timing gebruikt.

Woorden met timing: scripts/woorden-tts.json (ElevenLabs, via scripts/maak_vo.py) als die bestaat, anders
de oude herkenning: scripts/woorden-asr.json (body 1, sleutels "1".."5")
                  scripts/woorden-asr-nieuw.json (sleutels "b2h1" enz.)

Gebruik: python3 scripts/lijn_uit.py  ->  schrijft src/timing.json (sleutels "b1h1" enz.)
"""
import difflib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

GETALLEN = {"drie": "3", "vier": "4", "acht": "8"}
VERVANG = {"groote": "grote", "visscherij": "visserij", "m²": "meter", "m²,": "meter", "casco+": "casco"}


def norm(w):
    w = w.lower().strip(".,?!:;\"'*")
    w = VERVANG.get(w, w)
    w = GETALLEN.get(w, w)
    return re.sub(r"[^a-z0-9]", "", w)


def lijn_uit(tekst_zinnen, words):
    tokens = [(sid, w) for sid, z in tekst_zinnen for w in z.split()]
    a = [norm(w) for _, w in tokens]
    b = [norm(t) for _, _, t in words]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    tijd = [None] * len(tokens)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            s, e, _ = words[blk.b + k]
            tijd[blk.a + k] = [s, e]
    # Ontbrekende woorden: tijd verdelen tussen de buren
    i = 0
    while i < len(tokens):
        if tijd[i] is None:
            j = i
            while j < len(tokens) and tijd[j] is None:
                j += 1
            t0 = tijd[i - 1][1] if i > 0 else 0.0
            t1 = tijd[j][0] if j < len(tokens) else t0 + 0.35 * (j - i)
            stap = (t1 - t0) / (j - i)
            for k in range(i, j):
                tijd[k] = [round(t0 + stap * (k - i), 2), round(t0 + stap * (k - i + 1), 2)]
            i = j
        else:
            i += 1
    gematcht = sum(blk.size for blk in sm.get_matching_blocks())
    scenes = []
    for sid, _ in tekst_zinnen:
        idx = [k for k, (s, _) in enumerate(tokens) if s == sid]
        scenes.append({
            "id": sid,
            "start": tijd[idx[0]][0],
            "end": tijd[idx[-1]][1],
            "words": [{"t": tokens[k][1], "s": tijd[k][0], "e": tijd[k][1]} for k in idx],
        })
    return scenes, gematcht, len(tokens)


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    asr = {}
    tts_pad = ROOT / "scripts/woorden-tts.json"
    if tts_pad.exists():
        # Nieuwe voice-overs uit ElevenLabs: timing per woord komt rechtstreeks uit de TTS
        asr = json.loads(tts_pad.read_text())
    else:
        asr = _asr_oud()
    _schrijf(scripts, asr)


def _asr_oud():
    asr = {}
    oud = json.loads((ROOT / "scripts/woorden-asr.json").read_text())
    for k, v in oud.items():
        asr[f"b1h{k}"] = v
    nieuw_pad = ROOT / "scripts/woorden-asr-nieuw.json"
    if nieuw_pad.exists():
        asr.update(json.loads(nieuw_pad.read_text()))
    return asr


def _schrijf(scripts, asr):
    uit = {}
    for body, data in scripts.items():
        for h, hook in enumerate(data["hooks"], start=1):
            key = f"{body}h{h}"
            if key not in asr:
                print(f"{key}: geen voice-over gevonden, overgeslagen")
                continue
            zinnen = [("hook", hook)] + [tuple(z) for z in data["zinnen"]]
            scenes, ok, n = lijn_uit(zinnen, asr[key])
            uit[key] = {"scenes": scenes, "end": scenes[-1]["end"]}
            print(f"{key}: {ok}/{n} woorden gematcht, VO eindigt {scenes[-1]['end']:.2f}s; "
                  + ", ".join(f"{sc['id']} {sc['start']:.1f}" for sc in scenes))
    (ROOT / "src/timing.json").write_text(json.dumps(uit, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

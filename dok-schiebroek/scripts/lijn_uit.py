"""
Legt de scripttekst (scripts/scripts.json) over de herkende woorden van ElevenLabs TTS-timestamps
zodat elk scriptwoord een begin- en eindtijd krijgt. In beeld tonen we altijd de scripttekst;
de herkenning wordt alleen voor de timing gebruikt.

Herkende woorden: scripts/woorden-tts.json (sleutels "b1h1" enz.)

Gebruik: python3 scripts/lijn_uit.py  ->  schrijft src/timing.json (sleutels "b1h1" enz.)
"""
import difflib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

GETALLEN = {"twee": "2", "drie": "3"}
VERVANG = {"m²": "meter", "m²,": "meter", "ex.": "exclusief", "dok-bedrijfspand!": "dokbedrijfspand"}


def norm(w):
    w = w.lower().strip(".,?!:;\"'*")
    w = VERVANG.get(w, w)
    w = GETALLEN.get(w, w)
    return re.sub(r"[^a-z0-9]", "", w)


def voeg_getallen_samen(words):
    """Whisper schrijft bedragen soms als twee woorden ("222" ".500"); voeg die weer samen."""
    uit = []
    for s, e, t in words:
        if uit and re.fullmatch(r"\.\d{3}[.,]?", t) and re.fullmatch(r"\d+", uit[-1][2]):
            uit[-1] = [uit[-1][0], e, uit[-1][2] + t]
        else:
            uit.append([s, e, t])
    return uit


def lijn_uit(tekst_zinnen, words):
    words = voeg_getallen_samen(words)
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
    asr = json.loads((ROOT / "scripts/woorden-tts.json").read_text())

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

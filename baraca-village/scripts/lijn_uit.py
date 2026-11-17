"""
Legt de scripttekst (scripts/scripts.json) over de woordtiming van de ElevenLabs-voice-overs
(scripts/woorden-tts.json, gemaakt door maak_vo.py). In beeld staat altijd de scripttekst;
de gesproken tekst (bv. "honderdvijfenzestigduizend") wordt alleen voor de timing gebruikt.

Uitvoer: src/timing.json met per segment ("b1_body", "b1_h1", ...) de zinnen met woorden en tijden,
relatief aan het begin van dat segment, plus de duur van de mp3.
"""
import difflib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def norm(w):
    return re.sub(r"[^a-z0-9éëïöüè]", "", w.lower())


def duur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                                capture_output=True, text=True).stdout)


def lijn_uit(zinnen, words):
    tokens = [(sid, w) for sid, z in zinnen for w in z.split()]
    a = [norm(w) for _, w in tokens]
    b = [norm(t) for _, _, t in words]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    tijd = [None] * len(tokens)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            s, e, _ = words[blk.b + k]
            tijd[blk.a + k] = [s, e]
    # niet-gematchte woorden (getallen, afkortingen): tijd verdelen tussen de buren
    i = 0
    while i < len(tokens):
        if tijd[i] is None:
            j = i
            while j < len(tokens) and tijd[j] is None:
                j += 1
            t0 = tijd[i - 1][1] if i > 0 else 0.0
            t1 = tijd[j][0] if j < len(tokens) else words[-1][1]
            stap = (t1 - t0) / (j - i)
            for k in range(i, j):
                tijd[k] = [round(t0 + stap * (k - i), 3), round(t0 + stap * (k - i + 1), 3)]
            i = j
        else:
            i += 1
    ok = sum(blk.size for blk in sm.get_matching_blocks())
    scenes = []
    for sid, _ in zinnen:
        idx = [k for k, (s, _) in enumerate(tokens) if s == sid]
        scenes.append({"id": sid, "start": tijd[idx[0]][0], "end": tijd[idx[-1]][1],
                       "words": [{"t": tokens[k][1], "s": tijd[k][0], "e": tijd[k][1]} for k in idx]})
    return scenes, ok, len(tokens)


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    tts = json.loads((ROOT / "scripts/woorden-tts.json").read_text())
    uit = {}
    for b, data in scripts.items():
        segs = [(f"{b}_body", [tuple(z) for z in data["zinnen"]])]
        segs += [(f"{b}_h{h}", [("hook", t)]) for h, t in enumerate(data["hooks"], start=1)]
        for naam, zinnen in segs:
            scenes, ok, n = lijn_uit(zinnen, tts[naam])
            uit[naam] = {"scenes": scenes, "duur": round(duur(ROOT / f"public/vo/{naam}.mp3"), 3)}
            print(f"{naam}: {ok}/{n} gematcht, eind {scenes[-1]['end']:.2f}s / mp3 {uit[naam]['duur']:.2f}s")
    (ROOT / "src/timing.json").write_text(json.dumps(uit, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

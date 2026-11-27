"""
Woordtiming (ElevenLabs, gesproken vorm) -> src/timing.json met de geschreven vorm voor ondertitels.
Vervangen uitspraak (bv. "A twaalf") wordt teruggezet naar de schrijfwijze ("A12") over dezelfde tijdspanne.
Per body ook de begin-/eindtijd per zin (scènes), relatief aan het begin van de body.
"""
import json, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from maak_vo import UITSPRAAK, PAUZE

ROOT = Path(__file__).resolve().parent.parent
W = json.loads((ROOT / "scripts/woorden-tts.json").read_text())
S = json.loads((ROOT / "scripts/scripts.json").read_text())


def norm(t):
    return re.sub(r"[^\wëéï²']", "", t.lower())


def terug(words):
    out, i = [], 0
    pairs = [(a.split(), b.split()) for a, b in UITSPRAAK]
    while i < len(words):
        for wr, sp in pairs:
            n = len(sp)
            seg = words[i:i + n]
            if len(seg) == n and [norm(w[2]) for w in seg] == [norm(x) for x in sp]:
                # leestekens van het laatste gesproken woord behouden
                tail = re.sub(r"^.*?([.,!?]*)$", r"\1", seg[-1][2])
                parts = list(wr)
                parts[-1] += tail
                step = (seg[-1][1] - seg[0][0]) / len(parts)
                for k, p in enumerate(parts):
                    out.append([round(seg[0][0] + k * step, 3), round(seg[0][0] + (k + 1) * step, 3), p])
                i += n
                break
        else:
            out.append(words[i]); i += 1
    return out


def main():
    res = {}
    for b, d in S.items():
        body = terug(W[b]["body"])
        # zinnen: tel geschreven woorden per zin
        scenes, idx = [], 0
        for naam, zin in d["zinnen"]:
            n = len(zin.split())
            seg = body[idx:idx + n]
            assert seg and norm(seg[-1][2]) == norm(zin.split()[-1]), (naam, seg[-1], zin.split()[-1])
            scenes.append({"naam": naam, "start": seg[0][0], "end": seg[-1][1]})
            idx += n
        assert idx == len(body), (idx, len(body))
        res[b] = {"bodyDur": W[b]["bodyDur"], "words": body, "scenes": scenes}
        for i, hook in enumerate(d["hooks"], 1):
            k = f"{b}h{i}"
            hw = terug(W[k]["hook"])
            assert len(hw) == len(hook.split()), (k, len(hw), len(hook.split()))
            res[k] = {"hookDur": W[k]["hookDur"], "pause": PAUZE, "words": hw}
    (ROOT / "src/timing.json").write_text(json.dumps(res, ensure_ascii=False, indent=0))
    for s in res["b1"]["scenes"]:
        print(s)


if __name__ == "__main__":
    main()

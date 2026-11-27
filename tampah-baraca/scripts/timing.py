"""Woordtiming uit de ElevenLabs-alignment -> src/timing.json (per body: woorden + zinnen; per hook: woorden)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def woorden(al):
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                uit.append([round(s, 3), round(e, 3), cur])
            cur, s = "", None
            continue
        if s is None:
            s = cs
        cur += ch
        e = ce
    if cur:
        uit.append([round(s, 3), round(e, 3), cur])
    return uit


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    out = {}
    for b, d in scripts.items():
        al = json.loads((ROOT / f"scripts/tts-cache/{b}-body.alignment.json").read_text())
        w = woorden(al)
        zinnen = d["body"] + d["cta"]
        assert sum(len(z.split()) for z in zinnen) == len(w), b
        sent, i = [], 0
        for z in zinnen:
            n = len(z.split())
            sent.append({"start": w[i][0], "end": w[i + n - 1][1], "first": i, "count": n})
            i += n
        hooks = {}
        for h in range(1, len(d["hooks"]) + 1):
            ha = json.loads((ROOT / f"scripts/tts-cache/{b}h{h}-hook.alignment.json").read_text())
            hw = woorden(ha)
            hooks[str(h)] = {"words": hw, "end": hw[-1][1]}
        out[b] = {"words": w, "sentences": sent, "end": w[-1][1], "hooks": hooks}
    (ROOT / "src/timing.json").write_text(json.dumps(out, ensure_ascii=False))
    for b, v in out.items():
        print(b, [round(s["end"] - s["start"], 1) for s in v["sentences"]])


if __name__ == "__main__":
    main()

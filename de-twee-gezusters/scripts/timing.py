"""
Maakt src/timing.json uit scripts/scripts.json + scripts/woorden-tts.json (ElevenLabs-woordtiming).
Elk deel (b<b>-body, b<b>-h<h>) heeft tijden relatief aan het eigen begin; de body is opgedeeld in zinnen (scènes).
Gebruik: python3 scripts/timing.py
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def scenes(zinnen, woorden):
    tokens = [(sid, w) for sid, z in zinnen for w in z.split()]
    assert len(tokens) == len(woorden), (len(tokens), len(woorden), zinnen[0])
    uit = []
    for sid, _ in zinnen:
        idx = [k for k, (s, _) in enumerate(tokens) if s == sid]
        ws = [{"t": tokens[k][1], "s": woorden[k][0], "e": woorden[k][1]} for k in idx]
        uit.append({"id": sid, "start": ws[0]["s"], "end": ws[-1]["e"], "words": ws})
    return uit


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    woorden = json.loads((ROOT / "scripts/woorden-tts.json").read_text())
    uit = {}
    for b, data in scripts.items():
        sc = scenes([tuple(z) for z in data["zinnen"]], woorden[f"{b}-body"])
        uit[f"{b}-body"] = {"scenes": sc, "end": sc[-1]["end"]}
        for h, hook in enumerate(data["hooks"], start=1):
            sc = scenes([("hook", hook)], woorden[f"{b}-h{h}"])
            uit[f"{b}-h{h}"] = {"scenes": sc, "end": sc[-1]["end"]}
    for k, v in uit.items():
        v["audio"] = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                           str(ROOT / f"public/vo/{k}.wav")], capture_output=True, text=True).stdout)
    (ROOT / "src/timing.json").write_text(json.dumps(uit, ensure_ascii=False, indent=1))
    for k, v in uit.items():
        print(k, round(v["end"], 2), " ".join(f"{s['id']}@{s['start']:.1f}" for s in v["scenes"]))


if __name__ == "__main__":
    main()

"""
Legt de scriptzinnen over de woordtiming van ElevenLabs (scripts/woorden-tts.json) -> src/timing.json.
Sleutels: "b1" (body 1, tijd relatief aan het begin van de body-voice-over) en "b1h1" (hook, tijd relatief aan begin hook).
Gebruik: python3 scripts/lijn_uit.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
TAIL = 2.4  # seconden stilte/CTA-beeld na de laatste zin van de body


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    tts = json.loads((ROOT / "scripts/woorden-tts.json").read_text())
    uit = {}
    for b, data in scripts.items():
        body = tts[f"{b}-body"]
        words = body["words"]
        tokens = [(sid, w) for sid, z in data["zinnen"] for w in z.split()]
        assert len(tokens) == len(words), f"{b}: {len(tokens)} script-woorden vs {len(words)} gesproken woorden"
        scenes, k = [], 0
        for sid, z in data["zinnen"]:
            n = len(z.split())
            ws = [{"t": tokens[k + i][1], "s": words[k + i][0], "e": words[k + i][1]} for i in range(n)]
            scenes.append({"id": sid, "start": ws[0]["s"], "end": ws[-1]["e"], "words": ws})
            k += n
        uit[b] = {"scenes": scenes, "voEnd": scenes[-1]["end"], "voDuration": body["duration"], "frames": int(-(-(body["duration"] + TAIL) * FPS // 1))}
        for h, hook in enumerate(data["hooks"], start=1):
            hk = tts[f"{b}h{h}-hook"]
            hw = hk["words"]
            assert len(hook.split()) == len(hw), f"{b}h{h}: woordenaantal"
            ws = [{"t": t, "s": w[0], "e": w[1]} for t, w in zip(hook.split(), hw)]
            frames = int(-(-(hk["duration"] + hk["pauze"]) * FPS // 1))
            uit[f"{b}h{h}"] = {"words": ws, "voDuration": hk["duration"], "frames": frames}
    (ROOT / "src/timing.json").write_text(json.dumps(uit, ensure_ascii=False, indent=1))
    for b in ("b1", "b2"):
        print(b, "frames", uit[b]["frames"], "(%.1fs)" % (uit[b]["frames"] / FPS), ", ".join("%s %.1f-%.1f" % (s["id"], s["start"], s["end"]) for s in uit[b]["scenes"]))
    for k, v in uit.items():
        if "h" in k:
            print(k, v["frames"], "frames")


if __name__ == "__main__":
    main()

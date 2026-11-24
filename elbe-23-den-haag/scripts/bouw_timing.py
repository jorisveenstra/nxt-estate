"""
Bouwt src/timing.json uit scripts/woorden-tts.json + scripts/scripts.json + scripts/montage.json.

- Hook-segment per body/hook: hook-woorden vanaf 0, lengte = hook + PAUZE (afgerond op frames).
- Body-segment per body: woorden relatief aan de start van de body, plus staart voor de CTA.
- Per zin: begin/eind en de clips (harde cuts op woordgrenzen; geen overgangen).
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
PAUZE = 0.4
STAART = 1.6  # seconden na het laatste woord (CTA blijft staan)
MAX_CLIP = 7.8  # bronclips zijn 8 s


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    tts = json.loads((ROOT / "scripts/woorden-tts.json").read_text())
    montage = json.loads((ROOT / "scripts/montage.json").read_text())
    uit = {"fps": FPS, "bodies": {}, "hooks": {}}
    for b, data in scripts.items():
        m = montage[b]
        for i, _ in enumerate(data["hooks"], start=1):
            w = tts[f"{b}h{i}"]["woorden"]
            frames = math.ceil((w[-1][1] + PAUZE) * FPS)
            uit["hooks"][f"{b}h{i}"] = {"woorden": w, "frames": frames, "clip": m["hooks"][i - 1]}
        w = tts[f"{b}body"]["woorden"]
        zinnen, pos = [], 0
        for zi, zin in enumerate(data["zinnen"]):
            n = len(zin.split())
            zw = w[pos:pos + n]
            pos += n
            zinnen.append({"tekst": zin, "woorden": zw})
        assert pos == len(w), (b, pos, len(w))
        frames = math.ceil((w[-1][1] + STAART) * FPS)
        # Snijpunten: zin start op frame 0 (eerste zin) of op begin eerste woord.
        shots = []
        for zi, z in enumerate(zinnen):
            start = 0 if zi == 0 else round(z["woorden"][0][0] * FPS)
            eind = frames if zi == len(zinnen) - 1 else round(zinnen[zi + 1]["woorden"][0][0] * FPS)
            clips = m["zinnen"][zi]["clips"]
            # Verdeel de zin over de clips op woordgrenzen (gelijke stukken tijd)
            grenzen = [start]
            for k in range(1, len(clips)):
                doel = start + (eind - start) * k / len(clips)
                kandidaten = [round(x[0] * FPS) for x in z["woorden"][1:]]
                grenzen.append(min(kandidaten, key=lambda f: abs(f - doel)))
            grenzen.append(eind)
            for k, c in enumerate(clips):
                lengte = grenzen[k + 1] - grenzen[k]
                assert lengte <= MAX_CLIP * FPS, f"{b} zin {zi + 1}: clip te kort ({lengte / FPS:.1f}s), splits verder"
                shots.append({"clip": c, "from": grenzen[k], "frames": lengte})
            z["start"] = start
            z["eind"] = eind
            z["accent"] = m["zinnen"][zi].get("accent")
        uit["bodies"][b] = {"frames": frames, "zinnen": zinnen, "shots": shots, "cta": m["cta"]}
    (ROOT / "src/timing.json").write_text(json.dumps(uit, ensure_ascii=False, indent=1))
    for b, d in uit["bodies"].items():
        print(b, d["frames"] / FPS, "s,", len(d["shots"]), "shots")


if __name__ == "__main__":
    main()

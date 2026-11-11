"""Bouwt data/<seg>.json voor de revisie uit scripts/texts_rev.json + public/vo/*.align.json.
Hard cuts only; clips are native 1080x1920 Veo-clips (8 s)."""
import json, math, pathlib, sys
P = pathlib.Path(sys.argv[1]); FPS = 30; MAXSHOT = 236
T = json.loads((P / "scripts/texts_rev.json").read_text())
def sent_times(name):
    a = json.loads((P / f"public/vo/{name}.align.json").read_text())
    chars = "".join(a["characters"]); st, en = a["character_start_times_seconds"], a["character_end_times_seconds"]
    out, pos = [], 0
    for s in T[name]:
        i = chars.index(s, pos); j = i + len(s) - 1; pos = j + 1
        out.append((s, st[i], en[j]))
    return out, en[-1]
BODY_CLIPS = ["clips/c06.mp4", "clips/c24.mp4", "clips/c13.mp4", "clips/c19.mp4", "clips/c20.mp4", "clips/c05.mp4", "clips/c14.mp4"]
ACC = {
 "b1body": {0: ("14 bedrijfsunits opgeleverd", "left"), 1: ("De Meern · Utrecht", "right"), 3: ("Eigen unit = eigen thuisbasis", "left"),
            6: ("Hoogte · vloer · parkeren", "right"), 7: ("Sportgebruik mogelijk", "left"), 8: ("Slechts 14 units", "right")},
 "b2body": {0: ("14 bedrijfsunits opgeleverd", "left"), 1: ("De Meern · Utrecht", "right"), 3: ("Voorraad · inpak · kantoor", "left"),
            5: ("Klaar voor de koerier", "right"), 7: ("Afmetingen · hoogte · deur", "left")},
 "b3body": {0: ("14 bedrijfsunits opgeleverd", "left"), 1: ("De Meern · Utrecht", "right"), 3: ("Jouw eigen studio", "left"),
            7: ("Parkeren voor de deur · sanitair", "right"), 8: ("Trainingsstudio toegestaan", "left"), 9: ("Kosten vs. vaste klanten", "right")},
}
CTA = {"b1body": "Is deze locatie geschikt voor jou?", "b2body": "Past jouw webshop hier?", "b3body": "Benieuwd of jouw studio hier past?"}
def body(name):
    ss, end = sent_times(name)
    frames = math.ceil(end * FPS) + 15
    starts = [round(s[1] * FPS) for s in ss]
    # cuts: even targets snapped to sentence starts when that keeps every shot <= MAXSHOT
    n = len(BODY_CLIPS); cuts = [0]
    for k in range(1, n):
        target = cuts[-1] + (frames - cuts[-1]) / (n - k + 1)
        cands = [s for s in starts if abs(s - target) <= 45 and s - cuts[-1] <= MAXSHOT and s > cuts[-1] + 90
                 and (frames - s) <= MAXSHOT * (n - k)]
        c = min(cands, key=lambda s: abs(s - target)) if cands else round(target)
        cuts.append(int(c))
    cuts.append(frames)
    shots = [{"src": BODY_CLIPS[i], "from": cuts[i], "dur": cuts[i + 1] - cuts[i], "startSec": 0} for i in range(n)]
    assert all(s["dur"] <= 240 for s in shots), shots
    caps = []
    for i, (s, a, b) in enumerate(ss[:-1]):
        nxt = round(ss[i + 1][1] * FPS)
        caps.append({"text": s, "from": max(0, round(a * FPS) - 2), "to": nxt - 1})
    acc = [{"text": t, "from": max(0, round(ss[i][1] * FPS) - 2), "to": max(0, round(ss[i][1] * FPS) - 2) + 90, "side": side}
           for i, (t, side) in ACC[name].items()]
    cta = {"from": round(ss[-1][1] * FPS), "label": CTA[name], "button": "Vraag informatie aan"}
    return {"frames": frames, "shots": shots, "captions": caps, "accents": acc, "cta": cta, "hook": False}
HOOK_CLIP = {"b1h5": "clips/c20.mp4", "b3h2": "clips/c13.mp4", "b3h3": "clips/c14.mp4"}
def hook(name):
    d = json.loads((P / f"data/{name}.json").read_text())
    if name in T:
        ss, end = sent_times(name)
        d["frames"] = math.ceil(end * FPS) + 8
        d["captions"] = [{"text": ss[0][0], "from": 3, "to": d["frames"]}]
    clip = HOOK_CLIP.get(name, d["shots"][0]["src"])
    d["shots"] = [{"src": clip, "from": 0, "dur": d["frames"], "startSec": 0}]
    assert d["frames"] <= 240
    return d
for b in (1, 2, 3):
    (P / f"data/b{b}body.json").write_text(json.dumps(body(f"b{b}body"), ensure_ascii=False))
    for h in range(1, 6):
        (P / f"data/b{b}h{h}.json").write_text(json.dumps(hook(f"b{b}h{h}"), ensure_ascii=False))
print("ok")

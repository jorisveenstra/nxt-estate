"""Bouwt props/*.json voor de Remotion-compositie 'Ad': per body één body-deel (1x gerenderd) en per hook één hook-deel.
Final = hook-deel + body-deel, hard aan elkaar geplakt. Muziek loopt doorlopend door: body-deel start op vaste muziekoffset."""
import json, math, pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
FPS = 30
meta = json.loads((ROOT / "vo-meta.json").read_text())
scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
M0 = 300  # muziekoffset (frames) waarop het body-deel begint
HOOK_LEAD, HOOK_GAP, TAIL = 0.2, 0.35, 1.4

BODY_SHOTS = {
 1: "v04-1 v04-2 v05-1 v01-1 v02-1 v03-1 v02-2 v13-1 v05-2 v09-1 v11-1 v10-1 v09-2 v01-2 v03-2 v13-2 v04-3 v05-3".split(),
 2: "v12-1 v05-1 v04-2 v13-1 v03-1 v01-1 v02-1 v05-2 v12-2 v10-1 v09-1 v13-2 v04-3".split(),
 3: "v04-3 v03-2 v09-1 v11-1 v10-1 v02-1 v13-1 v09-2 v10-2 v11-2 v01-1 v13-2 v02-2 v12-1 v05-3 v04-1".split(),
}
HOOK_POOL = "v03-3 v01-3 v05-3 v02-3 v09-2 v10-2 v11-2 v01-2 v03-2 v02-2 v13-2 v10-1 v09-1 v05-2 v04-2 v03-1 v02-1 v11-1 v13-1 v05-1 v01-1 v12-2".split()
ACCENTS = {  # body -> (naald, tekst, sub)
 1: [("165.000", "Vanaf €165.000", "Vrijstaande villa · 1, 2 of 3 slaapkamers"), ("7,5", "Geraamd rendement 7,5% – 12%", "Prognose, geen garantie"),
     ("vier", "4 × 25%", "Betaling in vier gelijke termijnen"), ("HGB-titel", "PT PMA · HGB-titel", "Overdraagbaar en verlengbaar")],
 2: [("Mandalika", "Mandalika", "MotoGP · nieuwe vliegroutes"), ("fases", "Groeit in fases", "Gedeeld zwembad · gym · sauna · speeltuin")],
 3: [("110", "110 m² gelijkvloers", "2 slaapkamers · 2 badkamers"), ("205.000", "Vanaf €205.000", "Betaling in vier gelijke termijnen")],
}
CTA = {1: "Vraag het investeringsplan aan", 2: "Vraag het investeringsplan aan", 3: "Vraag de brochure aan"}
(ROOT / "props").mkdir(exist_ok=True)

def shots(ids, frames):
    out, f = [], 0
    for sid in ids:
        assert (ROOT / f'public/clips/{sid}.mp4').exists(), sid
        if f >= frames: break
        d = min(90, frames - f); out.append({"src": f"clips/{sid}.mp4", "from": f, "dur": d}); f += d
    assert f >= frames, (f, frames)
    return out

def norm(t): return re.sub(r"[^\w,.]", "", t.lower())
summary = {}
for b in (1, 2, 3):
    m = meta[f"body{b}"]; words = [{"s": w[0], "e": w[1], "t": w[2]} for w in m["words"]]
    frames = math.ceil((m["duration"] + TAIL) * FPS)
    ncta = len(scripts[b - 1]["cta"].split()); cta_s = words[-ncta]["s"]
    acc, last = [], -9
    for needle, text, sub in ACCENTS[b]:
        w = next(w for w in words if needle.lower() in w["t"].lower() and w["s"] > last)
        acc.append({"s": w["s"], "e": w["s"] + 3.4, "text": text, "sub": sub}); last = w["s"]
    for i in range(len(acc) - 1): acc[i]["e"] = min(acc[i]["e"], acc[i + 1]["s"] - 0.1)
    acc[-1]["e"] = min(acc[-1]["e"], cta_s - 0.2)
    props = {"frames": frames, "shots": shots(BODY_SHOTS[b], frames), "audio": [{"src": f"vo/body{b}.mp3", "from": 0}],
             "music": {"src": "muziek/achtergrond.mp3", "offsetFrames": M0, "volume": 1.0}, "words": words, "duckWords": words,
             "globalOffsetFrames": 0, "totalFrames": frames, "accents": acc,
             "cta": {"s": cta_s, "title": CTA[b], "sub": "Plan een vrijblijvend gesprek"}, "wordmark": True, "fadeIn": False, "fadeOut": True}
    (ROOT / f"props/body{b}.json").write_text(json.dumps(props, ensure_ascii=False, indent=1))
    summary[f"body{b}"] = frames
    for h in range(1, 6):
        hm = meta[f"b{b}h{h}"]; k = (b - 1) * 5 + h - 1
        hwords = [{"s": round(w[0] + HOOK_LEAD, 3), "e": round(w[1] + HOOK_LEAD, 3), "t": w[2]} for w in hm["words"]]
        hframes = round((HOOK_LEAD + hm["duration"] + HOOK_GAP) * FPS)
        ids = [HOOK_POOL[(3 * k + j) % len(HOOK_POOL)] for j in range(3)]
        hp = {"frames": hframes, "shots": shots(ids, hframes), "audio": [{"src": f"vo/b{b}h{h}.mp3", "from": round(HOOK_LEAD * FPS)}],
              "music": {"src": "muziek/achtergrond.mp3", "offsetFrames": M0 - hframes, "volume": 1.0}, "words": hwords, "duckWords": hwords,
              "globalOffsetFrames": 0, "totalFrames": hframes, "accents": [], "cta": None, "wordmark": True, "fadeIn": True, "fadeOut": False}
        (ROOT / f"props/b{b}h{h}-hook.json").write_text(json.dumps(hp, ensure_ascii=False, indent=1))
        summary[f"b{b}h{h}"] = hframes
print(summary)

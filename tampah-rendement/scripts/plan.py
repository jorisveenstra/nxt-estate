"""
Maakt src/plan.json: per body en per hook de woordtiming, scènes, knippunten van de clips en de stickers.
Hook- en bodydeel worden apart gerenderd (hook per variant, body één keer) en met ffmpeg aan elkaar gezet.
Gebruik: python3 scripts/plan.py   (na maak_vo.py)
"""
import json, math, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
PAUZE = 0.35   # stilte tussen hook en body
TAIL = 1.8     # seconden beeld na de laatste zin
ALLE = [22, 27, 13, 12, 14, 15, 10, 1, 26, 17, 21, 20, 2, 24, 25, 29, 28, 19, 4, 11, 0, 3, 5, 6, 7, 9, 16, 18, 23, 8]
SCRIPTS = json.loads((ROOT / "scripts/scripts.json").read_text())
W = json.loads((ROOT / "scripts/woorden.json").read_text())
CLIPLEN = {i: 5.08 if i == 29 else 4.0 for i in ALLE}

HOOK_CLIPS = {
    "b1": {1: [4, 19], 2: [27, 21], 3: [28, 1], 4: [2, 17], 5: [26, 20]},
    "b2": {1: [28, 19], 2: [29, 4], 3: [27, 21], 4: [28, 13, 19], 5: [13, 17]},
}
BODY_CLIPS = {
    "b1": {"intro": [22, 13, 25], "rendement": [12, 14], "masterplan": [11, 10, 15, 12, 14], "overheid": [14, 13, 24],
           "begeleiding": [24, 25, 0, 5], "oplevering": [29, 22, 3], "cijfers": [6, 7], "cta": [22, 13, 15]},
    "b2": {"intro": [22, 15, 12], "instap": [24, 25, 0], "nadal": [11, 10], "geengok": [12, 14, 15],
           "masterplan": [10, 15, 12, 14, 22], "overheid": [14, 12, 22], "oplevering": [24, 25, 3],
           "risico": [26, 17, 1, 2], "cta": [22, 15, 12]},
}
S = lambda at, text, sub="", icon="chart", count=None: dict(at=at, text=text, sub=sub, icon=icon, count=count)
HOOK_STICKERS = {
    "b1": {1: [S("spaargeld", "SPAARGELD", "nauwelijks rendement", "chart")],
           2: [S("spreiden", "SPREIDEN", "spaargeld · aandelen · vastgoed", "house")],
           3: [S("villa", "STRANDVILLA", "Zuid-Lombok", "umbrella"), S("tien", "10%", "netto, begroot*", "chart", 10)],
           4: [S("andere", "ANDERE KANT VAN DE WERELD", "", "plane"), S("grip", "GRIP", "houden", "eye")],
           5: [S("tien", "10%?", "netto, begroot*", "chart", 10), S("opgebouwd", "HOE OPGEBOUWD", "", "eye")]},
    "b2": {1: [S("bali", "BALI", "achteraf gezien", "plane")],
           2: [S("begin", "BEGIN VAN DE GROEI", "", "chart")],
           3: [S("vergeleken", "LOMBOK = BALI", "in een vroeg stadium", "wave")],
           4: [S("2028", "2028", "Rafa Nadal Academy", "racket"), S("zuidkust", "ZUIDKUST LOMBOK", "", "pin")],
           5: [S("zeker", "ZEKERHEID", "een plan erachter", "shield")]},
}
BODY_STICKERS = {
    "b1": {"intro": [S("strand", "AAN HET STRAND", "Zuid-Lombok", "umbrella"), S("tweehonderdtwintigduizend", "VANAF €220.000", "", "house")],
           "rendement": [S("nettorendement", "10%", "netto, begroot*", "chart", 10), S("waardestijging", "WAARDESTIJGING", "verwacht", "chart")],
           "masterplan": [S("masterplan", "MASTERPLAN", "Baraca Development", "pin")],
           "overheid": [S("provinciale", "PROVINCIE", "samenwerking", "shield"), S("gouverneur", "STEUN GOUVERNEUR", "", "check")],
           "begeleiding": [S("adviseur", "VASTE ADVISEUR", "", "check"), S("relatiemanager", "EIGEN RELATIEMANAGER", "", "check")],
           "oplevering": [S("tweede", "OPLEVERING Q2 2028", "gepland", "calendar")],
           "cijfers": [S("cijfers", "STAP VOOR STAP", "de cijfers", "eye")]},
    "b2": {"intro": [S("zuid-lombok", "ZUID-LOMBOK", "Bali in een vroeg stadium", "wave")],
           "instap": [S("tweehonderdtwintigduizend", "VANAF €220.000", "villa aan het strand", "house")],
           "nadal": [S("rafa", "RAFA NADAL ACADEMY", "tenniscentrum · 2028", "racket")],
           "geengok": [S("gok", "GEEN GOK", "maar een plan", "check")],
           "masterplan": [S("masterplan", "MASTERPLAN", "vlaggenschip Baraca", "pin")],
           "overheid": [S("provinciale", "WEST NUSA TENGGARA", "provinciale overheid", "shield"), S("gouverneur", "STEUN GOUVERNEUR", "", "check")],
           "oplevering": [S("tweede", "OPLEVERING Q2 2028", "gepland", "calendar")],
           "risico": [S("risico", "EERLIJK OVER RISICO", "", "eye")]},
}
norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())


def find(words, at):
    hits = [w for w in words if norm(w["t"]).startswith(norm(at))]
    if not hits: raise SystemExit(f"woord {at!r} niet gevonden in {[w['t'] for w in words]}")
    return hits[0]["s"]


def cuts(start, end, pool, used):
    n = max(1, math.ceil((end - start - 0.05) / 3.9))
    sf, ef = round(start * FPS), round(end * FPS)
    segs = []
    for k in range(n):
        a = sf + round((ef - sf) * k / n); b = sf + round((ef - sf) * (k + 1) / n)
        clip = next((c for c in pool + ALLE if c not in used), pool[0])
        used.add(clip)
        segs.append(dict(clip=clip, from_=a, dur=b - a))
    return segs


def scene(sid, words, start, end, pool, stickers, used):
    cl = cuts(start, end, pool, used)
    st = [dict(s, t=find(words, s["at"]), t_end=end) for s in stickers]
    return dict(id=sid, start=start, end=end, clips=cl, stickers=st)


out = {}
used_by = {}
for b, d in SCRIPTS.items():
    n = int(b[1])
    for h in range(1, 6):
        words = [dict(t=t, s=s, e=e) for s, e, t in W[f"{b}-h{h}"]]
        dur = words[-1]["e"]
        frames = math.ceil((dur + PAUZE) * FPS)
        used = set()
        sc = scene("hook", words, 0, frames / FPS, HOOK_CLIPS[b][h], HOOK_STICKERS[b][h], used)
        out[f"{b}-h{h}"] = dict(kind="hook", frames=frames, words=words, scenes=[sc], voDur=dur, used=sorted(used))
    # body: bepaal scènegrenzen uit woordaantallen
    words = [dict(t=t, s=s, e=e) for s, e, t in W[f"{b}-body"]]
    idx, scenes = 0, []
    for sid, z in d["zinnen"]:
        k = len(z.split())
        scenes.append((sid, words[idx:idx + k]))
        idx += k
    assert idx == len(words), (idx, len(words))
    total = words[-1]["e"] + TAIL
    frames = math.ceil(total * FPS)
    # body gebruikt andere clips dan de hook: per hook verschilt dat, dus per body één plan met pools zonder hookclips
    hookclips = set(c for h in range(1, 6) for c in out[f"{b}-h{h}"]["used"])
    used = set(hookclips)
    bs = []
    for i, (sid, ws) in enumerate(scenes):
        start = 0 if i == 0 else ws[0]["s"]
        end = scenes[i + 1][1][0]["s"] if i + 1 < len(scenes) else frames / FPS
        bs.append(scene(sid, words, start, end, BODY_CLIPS[b][sid], BODY_STICKERS[b].get(sid, []), used))
    out[f"{b}-body"] = dict(kind="body", frames=frames, words=words, scenes=bs, voDur=words[-1]["e"], used=sorted(used - hookclips))
(ROOT / "src/plan.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
for k, v in out.items():
    print(k, v["frames"], round(v["frames"] / FPS, 2), v["used"])
# overlap hook/body per video
for b in ("b1", "b2"):
    for h in range(1, 6):
        ov = set(out[f"{b}-h{h}"]["used"]) & set(out[f"{b}-body"]["used"])
        if ov: print("overlap", b, h, sorted(ov))

"""Montageplan -> src/plan.json: shots (harde cuts op zinsgrenzen), callouts en duur per segment.
Hook-segment: hook-VO + korte pauze. Body-segment: body + CTA + eindbeeld. Elke video = hook b<B>_h<H> + body b<B>."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
FPS = 30
CLIP_LEN = 8.0
# Bruikbare lengte per clip na beoordeling van de frames (d1_doorsnede_opslag kantelt na ~6 s te ver omhoog)
CLIP_MAX = {"d1_doorsnede_opslag": 6.0}
T = json.loads((ROOT / "src/timing.json").read_text())

HOOK_SHOT = {1: "c1_oranje_unit", 2: "a2_entrees", 3: "b3_hoekunit", 4: "d1_doorsnede_opslag", 5: "vv2_vogelvlucht"}
HOOK_ANSWER_SHOT = {4: "c1_oranje_unit"}  # revisie: B2H4 beantwoordt de openingsvraag
HOOK_TAG = {"1": "VOOR VAKMENSEN", "2": "VAN HUURDER NAAR EIGENAAR", "3": "VOOR BELEGGERS"}

BODY = {
 "1": {"shots": [["a2_hoek_boxcomplex"], ["d1_doorsnede_trap"], ["b3_hoekunit", "d1_doorsnede_opslag"], ["d1_doorsnede_trap"],
                 ["c1_oranje_unit", "a2_entrees"], ["vv2_vogelvlucht"], ["d1_doorsnede_trap"], ["b3_rij_water"],
                 ["b3_hoekunit"], ["a2_entrees", "a2_hoek_boxcomplex"]],
       "callouts": [["VANAF €209.900", "v.o.n. excl. btw"], ["±104–108 M²", "verdeeld over 2 lagen"], ["3,60 M VRIJE HOOGTE", "vloer 1.000 kg/m²"],
                    ["BOVEN: EXTRA RUIMTE", "bijv. voor planning & administratie"], ["OVERHEADDEUR", "+ 1 of 2 eigen parkeerplaatsen"],
                    ["A12 · A20", "Rotterdam · Gouda · Zoetermeer"], ["CASCO OPLEVERING", "zelf indelen"], ["OPLEVERING EIND Q2 2027", ""], None, None]},
 "2": {"shots": [["a2_hoek_boxcomplex"], ["a2_entrees", "b3_hoekunit"], ["d1_doorsnede_trap"], ["c1_oranje_unit"],
                 ["vv2_vogelvlucht", "b3_rij_water"], ["d1_doorsnede_opslag"], ["a2_hoek_boxcomplex"], ["b3_rij_water"],
                 ["b3_hoekunit"], ["a2_entrees"], ["a2_hoek_boxcomplex"]],
       "callouts": [["VANAF €209.900", "v.o.n. excl. btw"], ["EIGEN ADRES", "met eigen huisnummer"], ["CASCO", "zelf indelen en afwerken"],
                    ["JOUW PLEK", "voor jouw klanten"], ["BETALEN IN TERMIJNEN", "laatste 10% vlak voor oplevering eind Q2 2027"],
                    ["FINANCIERING?", ""], ["PARTNER: MOGELIJK", "mogelijkheden per situatie, geen garantie"],
                    ["LATER VERHUREN?", "eventueel mogelijk"], None, None, None]},
 "3": {"shots": [["a2_hoek_boxcomplex"], ["vv2_vogelvlucht", "b3_rij_water"], ["d1_doorsnede_trap"], ["c1_oranje_unit", "a2_entrees"],
                 ["b3_hoekunit"], ["b3_rij_water"], ["d1_doorsnede_opslag"], ["vv2_vogelvlucht"],
                 ["b3_hoekunit"], ["a2_entrees"], ["a2_hoek_boxcomplex"]],
       "callouts": [["VANAF €209.900", "v.o.n. excl. btw"], ["16 UNITS · COENECOOP", "vlak bij A12 en A20"], ["ZELF AFBOUW & HUURPRIJS", ""],
                    ["VERHUURBEGELEIDING", "ook na oplevering"], ["ERVARING MET KLEINE UNITS", "ontwikkelen · verkopen · verhuren"],
                    ["VvE-BEHEER", "voorzieningen & opstalverzekering"], ["CA. 7,4% NETTO*", "*indicatief, excl. financiering, geen garantie"],
                    ["OPLEVERING EIND Q2 2027", ""], None, None, None]},
}
POOL = ["a2_hoek_boxcomplex", "a2_entrees", "b3_hoekunit", "b3_rij_water", "c1_oranje_unit", "d1_doorsnede_trap", "d1_doorsnede_opslag", "vv2_vogelvlucht"]
CTA_FROM = {"1": 8, "2": 8, "3": 8}
BUTTON_FROM = {"1": 9, "2": 9, "3": 9}

def f(sec): return int(round(sec * FPS))

class Cursor:
    """Kiest per clip een nog ongebruikt stuk, zodat herhaalde clips steeds een ander deel tonen."""
    def __init__(self): self.c = {}; self.used = {}
    def take(self, clip, d):
        L = CLIP_MAX.get(clip, CLIP_LEN)
        assert d <= L, (clip, d)
        cur = self.c.get(clip, 0.0); used = self.used.setdefault(clip, [])
        cands = [x for x in (cur, L - d, (L - d) / 2, 0.0) if 0 <= x and x + d <= L + 1e-6]
        s = next((x for x in cands if all(abs(x - u) > 1.0 for u in used)), cands[0])
        used.append(s); self.c[clip] = s + d
        return s

plan = {"fps": FPS, "segments": {}}
for b, cfg in BODY.items():
    for h in range(1, 6):
        name = f"b{b}_h{h}"; dur = T[name]["duur"] + 0.35
        clip = HOOK_SHOT[h]
        if dur <= CLIP_MAX.get(clip, CLIP_LEN):
            shots = [{"clip": clip, "from": 0, "start": 0, "frames": f(dur)}]
        else:
            # Langere hook (vraag + antwoord): harde cut op het begin van de tweede zin naar een tweede clip.
            ws = T[name]["woorden"]
            cut = next(w["t0"] for p, w in zip(ws, ws[1:]) if p["w"].endswith("?")) - 0.08
            clip2 = HOOK_ANSWER_SHOT[h]
            assert cut <= CLIP_MAX.get(clip, CLIP_LEN) and dur - cut <= CLIP_MAX.get(clip2, CLIP_LEN), (name, cut, dur)
            shots = [{"clip": clip, "from": 0, "start": 0, "frames": f(cut)},
                     {"clip": clip2, "from": 0, "start": f(cut), "frames": f(dur) - f(cut)}]
        plan["segments"][name] = {"type": "hook", "vo": name, "frames": f(dur), "tag": HOOK_TAG[b], "shots": shots}
    name = f"b{b}"; t = T[f"b{b}_body"]; z = t["zinnen"]
    assert len(z) == len(cfg["shots"]) == len(cfg["callouts"]), (b, len(z))
    end = t["duur"] + 2.2
    cur = Cursor(); shots = []
    for i, clips in enumerate(cfg["shots"]):
        s0 = 0 if i == 0 else z[i]["t0"] - 0.08
        s1 = end if i == len(z) - 1 else z[i + 1]["t0"] - 0.08
        n = max(len(clips), int((s1 - s0) // 7.6) + 1)
        seq = list(clips)
        nxt = cfg["shots"][i + 1][0] if i + 1 < len(cfg["shots"]) else None
        while len(seq) < n:
            prev = seq[-1]
            opts = [c for c in POOL if c not in (prev, nxt) and c not in seq]
            seq.append(min(opts, key=lambda c: cur.c.get(c, 0)))
        seq = seq[:n]
        for k, c in enumerate(seq):
            a = s0 + (s1 - s0) * k / n; d = (s1 - s0) / n
            shots.append({"clip": c, "from": round(cur.take(c, d), 3), "start": f(a), "frames": f(a + d) - f(a)})
    for x, y in zip(shots, shots[1:]):
        assert x["clip"] != y["clip"] or abs(y["from"] - (x["from"] + x["frames"] / FPS)) < 0.05, (b, x, y)
    callouts = [{"start": f(z[i]["t0"]), "end": f(z[i + 1]["t0"] - 0.08) if i + 1 < len(z) else f(end), "title": c[0], "sub": c[1]}
                for i, c in enumerate(cfg["callouts"]) if c]
    plan["segments"][name] = {"type": "body", "vo": f"b{b}_body", "frames": f(end), "shots": shots, "callouts": callouts,
                              "ctaFrom": f(z[CTA_FROM[b]]["t0"]), "buttonFrom": f(z[BUTTON_FROM[b]]["t0"])}
(ROOT / "src/plan.json").write_text(json.dumps(plan, ensure_ascii=False, indent=1))
for k, v in plan["segments"].items():
    if v["type"] == "body":
        print(k, v["frames"] / FPS, [(s["clip"][:6], s["from"], round(s["frames"] / FPS, 1)) for s in v["shots"]])

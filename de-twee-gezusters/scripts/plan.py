"""Legt scripttekst over de TTS-timing en plant de shots per hook/body -> src/data.json.
Gebruik: python3 scripts/plan.py   (na maak_vo.py en prep_clips.py)"""
import json, math, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
FPS = 30
PAUZE = 0.35   # stilte tussen hook en body
TAIL = 1.6     # na de laatste zin van de body

POOLS = {
 "EXT_REAL": "d_geb1 d_geb2 d_eind1 d_eind2 d_water1 d_water2 d_groen d_park2 d_balkons d_rise gevel_balkons gevel_bomen vijver_static".split(),
 "EXT_AI": "ai_Scene_2 ai_Scene_20_2 ai_Scene_3".split(),
 "PARK_REAL": "d_vijver1 d_vijver2 park1 park2 vijver balkon_park vijver_static".split(),
 "TERRAS_REAL": "balkon1 balkon_pui balkon_gevel terras_hoek terras_hoek2 terras_pui schuifpui balkon_park".split(),
 "LIVING_REAL": "woonk1 woonk_breed1 woonk_schuif woonk_breed2 woonk_push".split(),
 "LIVING_AI": "ai_app_4 ai_app_6_2 ai_app_7".split(),
 "KITCHEN_AI": "ai_app_3 ai_app_7".split(),
 "BED_REAL": "slaap1a slaap1b slaap2".split(),
 "HALL_REAL": "entree gang gang_wk trap1 trap2 overloop".split(),
 "CITY_REAL": "d_pano1 d_pano2 d_rise".split(),
 "STEEG_REAL": "steeg1 steeg2 gevel_bouw".split(),
}
E, EA, P, T, L, LA, K, B, H, C, S = ("EXT_REAL", "EXT_AI", "PARK_REAL", "TERRAS_REAL", "LIVING_REAL", "LIVING_AI", "KITCHEN_AI", "BED_REAL", "HALL_REAL", "CITY_REAL", "STEEG_REAL")
BODY_SPEC = {
 "1": [[E, EA], [E, EA], [EA, E], [LA, L], [B, LA], [T, P], [P, EA], [K], [K, H, S], [EA, P]],
 "2": [[E, EA], [E, EA], [H, LA], [C, EA], [S, H], [C, S], [P, T, EA], [EA, E], [E, C], [EA, P]],
 "3": [[EA, E], [E, EA], [EA, E], [E, LA], [L, T], [C, EA], [S, EA], [K, LA], [EA, P], [E, EA], [EA, P, EA]],
}
HOOK_SPEC = {
 "1": {1: [LA, L], 2: [EA, P], 3: [T, EA], 4: [EA, L], 5: [B, LA]},
 "2": {1: [LA, T], 2: [K, E], 3: [P, EA], 4: [H, C], 5: [EA, E]},
 "3": {1: [P, C], 2: [EA, P], 3: [EA, E], 4: [C, LA], 5: [L, LA]},
}
# (grote regel, kleine regel) per zin; None = geen callout. De laatste is de CTA.
CALL = {
 "1": [("Emile van Loonpark", "Roosendaal"), ("Oplevering eind 2026", "geen dubbele lasten"), ("7 villa-appartementen", "1 per verdieping"), ("119 – 180 m²", "volledig gelijkvloers"),
       ("2 of 3 slaapkamers", "ruimte voor (klein)kinderen"), ("30 – 137 m² buiten", "op de zon, park als voortuin"), ("Geen tuinonderhoud", None), None,
       ("Turnkey", "geen bouwrente · eigen berging & parkeerplaats"), ("Plan een bezichtiging", "klik op de knop hieronder")],
 "2": [("Emile van Loonpark", "Roosendaal"), ("Oplevering eind 2026", "geen dubbele lasten"), ("Gelijkvloers + lift", "naar alle verdiepingen"), ("Centrum & OV", "op loopafstand"),
       ("Eigen berging", "+ eigen parkeerplaats, afgesloten terrein"), ("Tweede auto?", "jaarabonnement in Roosendaal"), ("Park + buitenruimte op de zon", "geen snoeien of maaien"), ("Kleine VvE", "7 appartementen"),
       ("Hoogste punt: 11 maart 2026", "het gebouw staat er al"), ("Plan een bezichtiging", "klik op de knop hieronder")],
 "3": [("Vughtstraat, Roosendaal", "direct aan het Emile van Loonpark"), ("Oplevering eind 2026", "geen dubbele lasten"), ("7 villa-appartementen", "verdeeld over 2 gebouwen"), ("1 per verdieping", "geen buren naast je"),
       ("119 – 180 m²", "ruime buitenruimte op de zon"), ("Centrum & station", "Rotterdam · Breda · Antwerpen"), ("Eigen parkeerplaats", "2e auto: jaarabonnement"), ("Turnkey · A+++", "geen bouwrente, geen verbouwing"),
       ("Kleine VVE", None), ("Oplevering eind 2026", None), ("Plan een bezichtiging", "klik op de knop hieronder")],
}
SPREEK = {"A+++": "A plus plus plus", "VvE": "V V E", "VVE": "V V E"}


def spreek(t):
    for a, b in SPREEK.items(): t = t.replace(a, b)
    return t


def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)


def spoken_words(al):
    out, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur: out.append((cur, s, e))
            cur, s = "", None; continue
        if s is None: s = cs
        cur += ch; e = ce
    if cur: out.append((cur, s, e))
    return out


def align(display_sents, al):
    sp = spoken_words(al); i = 0; words = []; sents = []
    for si, sent in enumerate(display_sents):
        first = len(words)
        for w in sent.split():
            n = len(spreek(w).split()); chunk = sp[i:i + n]; i += n
            words.append({"t": w, "s": round(chunk[0][1], 3), "e": round(chunk[-1][2], 3), "i": si})
        sents.append({"s": words[first]["s"], "e": words[-1]["e"], "w0": first, "w1": len(words)})
    assert i == len(sp), (i, len(sp))
    return words, sents


CL = {}
def clen(c):
    if c not in CL: CL[c] = dur(ROOT / f"public/clips/{c}.mp4")
    return CL[c]


class Picker:
    def __init__(self, seed=()):
        self.last = {c: -1 for p in POOLS.values() for c in p}; self.uses = {}; self.n = 0
        for c in seed: self.last[c] = 10**6
    def pick(self, pool, sl):
        for c in sorted(POOLS[pool], key=lambda c: (self.last[c], c)):
            L = clen(c); u = self.uses.get(c, 0)
            ts = 0.0 if c.startswith("ai_") is False else (u % 2) * 3.8
            if not c.startswith("ai_"): ts = 0.0 if u == 0 else max(0.0, min(0.6 * u, L - 1.2))
            rate = min(1.0, (L - ts - 0.12) / sl)
            if rate < 0.6: continue
            self.n += 1; self.last[c] = self.n; self.uses[c] = u + 1
            return {"clip": c, "trim": round(ts, 3), "rate": round(rate, 4)}
        c = sorted(POOLS[pool], key=lambda c: -clen(c))[0]
        self.n += 1; self.last[c] = self.n
        return {"clip": c, "trim": 0, "rate": round(min(1, (clen(c) - 0.12) / sl), 4)}


def shots(bounds, specs, picker, total):
    """bounds = starttijden per zin; elke zin krijgt ~3s shots, harde sneden."""
    out = []; g = 0
    for i, st in enumerate(bounds):
        en = bounds[i + 1] if i + 1 < len(bounds) else total
        n = max(1, round((en - st) / 3.0)); pools = specs[i] if isinstance(specs[i], list) else [specs[i]]
        for k in range(n):
            a = st + (en - st) * k / n; b = st + (en - st) * (k + 1) / n
            fa, fb = round(a * FPS), round(b * FPS)
            sh = picker.pick(pools[g % len(pools)], (fb - fa) / FPS); g += 1
            out.append({**sh, "from": fa, "frames": fb - fa, "sent": i})
    return out


def main():
    sc = json.loads((ROOT / "scripts/scripts.json").read_text()); data = {}
    for b, d in sc.items():
        vo = json.loads((ROOT / f"scripts/vo/b{b}.json").read_text())
        sents = d["body"] + d["cta"]
        words, ss = align(sents, vo["alignment"])
        total = math.ceil((ss[-1]["e"] + TAIL) * FPS) / FPS
        bounds = [0.0] + [round(s["s"] - 0.05, 3) for s in ss[1:]]
        pk = Picker(); bs = shots(bounds, BODY_SPEC[b], pk, total)
        data[f"b{b}"] = {"kind": "body", "frames": round(total * FPS), "words": words, "sents": ss, "shots": bs, "callouts": CALL[b], "audio": f"b{b}", "audioDur": dur(ROOT / f"scripts/vo/b{b}.mp3")}
        for h, hook in enumerate(d["hooks"], 1):
            hv = json.loads((ROOT / f"scripts/vo/b{b}h{h}.json").read_text())
            hw, hs = align([hook], hv["alignment"])
            ad = dur(ROOT / f"scripts/vo/b{b}h{h}.mp3"); tot = math.ceil((ad + PAUZE) * FPS) / FPS
            hp = Picker(seed=[bs[0]["clip"]]); hspec = HOOK_SPEC[b][h]
            n = max(1, min(len(hspec), round(tot / 2.8))); hb = [tot * k / n for k in range(n)]
            hsh = shots(hb, [[hspec[k]] for k in range(n)], hp, tot)
            data[f"b{b}h{h}"] = {"kind": "hook", "frames": round(tot * FPS), "words": hw, "sents": hs, "shots": hsh, "callouts": [], "audio": f"b{b}h{h}", "audioDur": ad}
    (ROOT / "src/data.json").write_text(json.dumps(data, ensure_ascii=False))
    for k, v in data.items(): print(k, v["frames"] / FPS, len(v["shots"]))


if __name__ == "__main__":
    main()

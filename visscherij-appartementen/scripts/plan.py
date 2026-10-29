"""Maakt src/plans.json: per video de shots (harde sneden), ondertitelblokken en callouts uit woorden-tts.json."""
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
FPS = 30
S = json.loads((ROOT / "scripts/scripts.json").read_text())
W = json.loads((ROOT / "scripts/woorden-tts.json").read_text())
CL = {"ext": ["Building___Forward_Appartement", "voorgevel_apparement___Right", "Building___Right"],
      "park": ["Building___Right", "Building___Forward_Appartement"],
      "int": ["Woonkamer_-_appartement__Push_in", "Woonkamer_appartement__Push_in", "Woonkamer_-_appartement___Forward",
              "Woonkamer_-_appartement___PAN", "Woonkamer___Left_-_Appartement"]}
CALL = [  # (regex op woord, tekst) - eerste keer per video
 (r"^acht$", "8 appartementen"), (r"^vierhonderdduizend$", "± € 400.000"), (r"^vijfhonderdduizend", "Onder € 500.000"),
 (r"^gasloos", "Gasloos · warmtepomp"), (r"^vloerverwarming", "Vloerverwarming"), (r"^loggia$", "Loggia op het westen"),
 (r"^berging", "Eigen berging"), (r"^parkeerplaats", "Eigen parkeerplaats"), (r"^kwartaal$", "Oplevering Q3 2028"),
 (r"^negenentachtig$", "± 89 en 96 m²"), (r"^Vissershaven", "Vissershaven · Noordzeekanaal"),
 (r"^balkonbeglazing", "Optie: balkonbeglazing"), (r"^Duinstraat", "Duinstraat, Oud-IJmuiden"),
 (r"^ruige$", "Ruige stranden in de buurt"), (r"^volop$", "Volop licht"), (r"^tuin$", "Eigen tuin of loggia"),
 (r"^honderd$", "Bijna 100 m²"), (r"^monding$", "Aan het Noordzeekanaal"), (r"^thuis$", "Plek om thuis te werken")]
CHUNK = 4

def chunks(words):
    out, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= CHUNK or re.search(r"[.,?!:;]$", w[2]):
            out.append(cur); cur = []
    if cur: out.append(cur)
    return [{"start": c[0][0], "end": c[-1][1], "words": [[x[0], x[1], x[2]] for x in c]} for c in out]

plans = {}
for key, v in W.items():
    b, h = int(key[1]), int(key[3]); d = S[f"b{b}"]
    n_hook = len(v["hook"]); words = v["hook"] + v["body"]
    # onderwerp per woord
    topic = ["int" if h % 2 else "ext"] * n_hook
    i = 0
    for t, z in d["zinnen"]:
        topic += [t] * len(z.split()); i += len(z.split())
    topic += ["ext"] * (len(words) - len(topic))  # CTA: gevel
    topic_at = lambda t: topic[min(range(len(words)), key=lambda j: abs((words[j][0] + words[j][1]) / 2 - t))]
    total = v["duur"] + 1.0
    shots, t, used, n = [], 0.0, [], 0
    while t < total - 0.05:
        dur = [3.0, 2.6, 2.8][n % 3]
        if total - t - dur < 1.2: dur = total - t
        pool = CL[topic_at(min(t + dur / 2, v["duur"]))]
        k = (n + h + b) % len(pool); clip = pool[k]
        if used and clip == used[-1]: clip = pool[(k + 1) % len(pool)]
        used.append(clip)
        ss = [0.0, 1.0][(n + h) % 2]; zoom = [1.0, 1.18][(n + b + h // 2) % 2]; ax = [50, 35, 65][(n + h) % 3]
        shots.append({"clip": clip, "from": round(t * FPS), "dur": round((t + dur) * FPS) - round(t * FPS),
                      "ss": ss, "zoom": zoom, "ax": ax})
        t += dur; n += 1
    seen, calls = set(), []
    for s, e, w in words:
        for rx, txt in CALL:
            if txt not in seen and re.search(rx, w.strip(".,?!:;'"), re.I):
                seen.add(txt); calls.append({"start": s, "end": s + 2.4, "text": txt}); break
    last_end = -9; filt = []
    for c in calls:  # geen overlap
        if c["start"] >= last_end + 0.2: filt.append(c); last_end = c["end"]
    cta_start = v["body"][len(v["body"]) - len(d["cta"].split())][0]
    plans[key] = {"frames": round(total * FPS), "audio": f"vo/{key}.wav", "shots": shots, "captions": chunks(words),
                  "callouts": filt, "ctaStart": cta_start, "hookEnd": v["hook"][-1][1]}
(ROOT / "src/plans.json").write_text(json.dumps(plans, ensure_ascii=False))
for k, p in plans.items(): print(k, p["frames"], len(p["shots"]), [c["text"] for c in p["callouts"]])

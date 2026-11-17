"""
Montageplan: welke clip, welk grafisch accent en welk geluidseffect op welk woord.
Alles wordt verankerd aan woorden uit src/timing.json en geschreven naar src/plan.json,
dat zowel door Remotion (beeld) als door scripts/mix_audio.py (geluid) wordt gelezen.

Shots: (clip, zin, woordindex, startpunt in de clip in s). Een shot loopt tot het volgende shot;
alleen harde cuts, geen overgangen.
Gebruik: python3 scripts/plan.py
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
PAUZE = 0.35  # stilte tussen hook en body
STAART = 2.2  # seconden na de laatste zin van de body

SHOTS = {
    "b1": [("drone_zee", "s1", 0, 0), ("drone_orbit", "s1", 5, 0),
           ("drone_zee_links", "s2", 0, 3), ("zwembad", "s2", 6, 0),
           ("drone_orbit", "s3", 0, 4), ("straat", "s3", 5, 0),
           ("villa1", "s4", 0, 0),
           ("drone_zee", "s5", 0, 2),
           ("villa3", "s6", 0, 0), ("woonkamer", "s6", 8, 0),
           ("keuken", "s7", 0, 0),
           ("slaapkamer", "s8", 0, 0), ("zwembad_rechts", "s8", 7, 0),
           ("poort", "cta", 0, 0), ("villa2", "cta", 6, 0)],
    "b2": [("drone_zee", "s1", 0, 0), ("poort", "s1", 5, 0),
           ("villa1", "s2", 0, 0), ("villa2", "s2", 6, 0), ("villa3", "s2", 8, 0),
           ("zwembad", "s3", 0, 0), ("woonkamer", "s3", 13, 0),
           ("slaapkamer", "s4", 0, 0), ("keuken", "s4", 7, 0),
           ("straat", "s5", 0, 0),
           ("poort_kinderen", "s6", 0, 0), ("drone_orbit", "s6", 9, 0),
           ("woonkamer_tuin", "s7", 0, 0),
           ("keuken_eiland", "s8", 0, 0), ("villa2_zwembad", "s8", 8, 0),
           ("villa3", "cta", 0, 3), ("drone_zee_links", "cta", 5, 0)],
    "b3": [("villa1", "s1", 0, 0), ("drone_zee_links", "s1", 10, 0),
           ("drone_zee", "s2", 0, 4), ("zwembad", "s2", 9, 0), ("keuken", "s2", 16, 0),
           ("speeltuin", "s3", 0, 0), ("poort", "s3", 10, 0),
           ("villa2_zwembad", "s4", 0, 0),
           ("drone_orbit", "s5", 0, 0),
           ("straat", "s6", 0, 0),
           ("woonkamer", "s7", 0, 0), ("badkamer", "s7", 14, 0),
           ("slaapkamer", "s8", 0, 0), ("villa3", "s8", 11, 0),
           ("villa2", "cta", 0, 0)],
}

HOOK_SHOTS = {
    "b1_h1": [("drone_orbit", 0, 0), ("villa2_zwembad", 9, 0)],
    "b1_h2": [("zwembad", 0, 0), ("drone_zee", 4, 0)],
    "b1_h3": [("drone_zee_links", 0, 0), ("villa1", 7, 0)],
    "b1_h4": [("villa3", 0, 0), ("drone_orbit", 9, 2)],
    "b2_h1": [("woonkamer_tuin", 0, 0), ("villa2", 8, 0)],
    "b2_h2": [("drone_zee", 0, 0), ("poort", 4, 0)],
    "b2_h3": [("villa1", 0, 0), ("keuken_eiland", 6, 0)],
    "b2_h4": [("zwembad", 0, 0), ("villa3", 9, 0)],
    "b2_h5": [("drone_orbit", 0, 0), ("straat", 12, 0)],
    "b3_h1": [("villa2_zwembad", 0, 0), ("drone_zee", 10, 3)],
    "b3_h2": [("zwembad_rechts", 0, 0), ("villa1", 6, 0)],
    "b3_h3": [("drone_zee_links", 0, 0), ("slaapkamer", 11, 0)],
    "b3_h4": [("drone_zee", 0, 0), ("poort", 8, 0)],
    "b3_h5": [("drone_orbit", 0, 0), ("villa3", 12, 0)],
}

KICKER = {
    "b1_h1": ("Bali, tien jaar geleden?", None), "b1_h2": ("Lombok: het eiland naast Bali", None),
    "b1_h3": ("Kustgrond wordt schaars", None), "b1_h4": ("Vroeg instappen zonder gok", None),
    "b2_h1": ("Alles in NL vastgoed of beurs?", None), "b2_h2": ("Eigendom in Indonesië?", None),
    "b2_h3": ("Juridisch: hoe zit dat?", None), "b2_h4": ("10% belasting op huur*", "volgens de ontwikkelaar"),
    "b2_h5": ("Spreiden mét structuur", None),
    "b3_h1": ("Strand op 5 minuten", None), "b3_h2": ("Je eigen vakantieadres", None),
    "b3_h3": ("Tussen rijstvelden en zee", None), "b3_h4": ("Ver weg, tóch grip", None),
    "b3_h5": ("Hier komt jouw villa", None),
}

# Accenten: (type, zin, woordindex, gegevens). Ze blijven staan tot het eind van de zin
# (of tot het volgende accent in dezelfde zin begint), tenzij 'tot' (zin, woordindex) is gegeven.
ACCENTS = {
    "b1": [
        ("chip", "s1", 4, {"icon": "pin", "text": "Zuid-Lombok"}),
        ("vergelijk", "s1", 10, {"links": "Bali", "linksSub": "toen", "rechts": "Zuid-Lombok", "rechtsSub": "nu"}),
        ("chip", "s2", 0, {"icon": "landmark", "text": "Mandalika", "sub": "speciale economische zone"}),
        ("trend", "s3", 6, {"text": "Grondprijzen", "sub": "stijgen flink"}),
        ("chip", "s4", 2, {"icon": "x", "text": "Geen los project"}),
        ("fases", "s5", 3, {"label": "Fase 1 van 5", "sub": "masterplan"}),
        ("stat", "s6", 4, {"value": "€165.000", "label": "instap vanaf"}),
        ("termijnen", "s6", 13, {"n": 4, "label": "4 gelijke termijnen tijdens de bouw"}),
        ("stat", "s7", 1, {"value": "2028", "label": "geplande oplevering"}),
        ("trend", "s8", 1, {"text": "Prijzen stijgen", "sub": "naarmate de bouw vordert"}),
        ("cta", "cta", 1, {"knop": "Vraag het investeringsplan aan", "sub": "Plan vrijblijvend een gesprek"}),
    ],
    "b2": [
        ("chip", "s1", 1, {"icon": "pin", "text": "Baraca Village", "sub": "Zuid-Lombok"}),
        ("chip", "s1", 5, {"icon": "globe", "text": "Spreiden buiten Nederland"}),
        ("kamers", "s2", 5, {"items": ["1", "2", "3"], "label": "slaapkamers", "cues": [5, 6, 8]}),
        ("stat", "s2", 10, {"value": "€165.000", "label": "vrijstaande villa vanaf"}),
        ("duo", "s3", 8, {"a": ["7,5%", "lange verhuur"], "b": ["12%", "korte verhuur"], "cueB": 14,
                          "note": "verwacht netto huurrendement"}),
        ("duo", "s4", 3, {"a": ["10%", "belasting op huur"], "b": ["± 2,5%", "effectief bij verkoop"], "cueB": 10,
                          "note": "volgens de ontwikkelaar"}),
        ("chip", "s5", 5, {"icon": "vraag", "text": "Juridisch geregeld?"}),
        ("lijst", "s6", 8, {"items": ["PT PMA", "HGB-titel", "Overdragen · verlengen · vernieuwen"], "cues": [8, 11, 15]}),
        ("chip", "s7", 3, {"icon": "info", "text": "Fiscaal in Nederland?", "sub": "bespreek het met uw eigen adviseur"}),
        ("lijst", "s8", 7, {"items": ["Eigendomsstructuur", "Betaalschema", "Verwachte rendementen"], "cues": [7, 9, 13]}),
        ("cta", "cta", 0, {"knop": "Vraag het investeringsplan aan", "sub": "Gesprek over de eigendomsstructuur"}),
    ],
    "b3": [
        ("chip", "s1", 5, {"icon": "home", "text": "Vrijstaande villa"}),
        ("chip", "s1", 10, {"icon": "pin", "text": "Zuid-Lombok", "sub": "heuvels en rijstvelden"}),
        ("duo", "s2", 7, {"a": ["5 min", "naar Tampah Bay"], "b": ["20 min", "naar Kuta"], "cueB": 12, "note": None}),
        ("lijst", "s3", 6, {"items": ["Sauna", "Sportschool", "Afgesloten ingang"], "cues": [6, 8, 11]}),
        ("chip", "s4", 7, {"icon": "sleutel", "text": "Tussendoor verhuren"}),
        ("chip", "s5", 5, {"icon": "vraag", "text": "Grip op afstand?"}),
        ("stat", "s6", 8, {"value": "45 min", "label": "vanaf vliegveld Lombok"}),
        ("chip", "s7", 3, {"icon": "gesprek", "text": "Persoonlijk gesprek", "sub": "met het team van Baraca Capital"}),
        ("stat", "s8", 8, {"value": "€165.000", "label": "1-slaapkamervilla vanaf"}),
        ("chip", "s8", 14, {"icon": "kalender", "text": "Oplevering gepland: 2028"}),
        ("cta", "cta", 0, {"knop": "Bekijk de villa's", "sub": "Plan vrijblijvend een gesprek"}),
    ],
}

# Subtiele geluidseffecten: accent-pop bij cijfers/lijstjes, zachte whoosh bij labels,
# sfeer (golven/tropisch/water) zacht onder passende shots.
SFEER = {"drone_zee": "golven", "drone_zee_links": "golven", "villa2_zwembad": "tropisch",
         "villa1": "tropisch", "speeltuin": "water"}


def scene(timing, sid):
    return next(s for s in timing["scenes"] if s["id"] == sid)


def woord(timing, sid, i):
    return scene(timing, sid)["words"][i]["s"]


def main():
    clips = json.loads((ROOT / "src/clips.json").read_text())
    timing = json.loads((ROOT / "src/timing.json").read_text())
    plan = {"fps": FPS, "pauze": PAUZE, "staart": STAART, "bodies": {}, "hooks": {}}
    for b, shots in SHOTS.items():
        t = timing[f"{b}_body"]
        eind = t["scenes"][-1]["end"] + STAART
        frames = math.ceil(eind * FPS)
        starts = [0.0 if k == 0 else woord(t, sid, i) for k, (_, sid, i, _) in enumerate(shots)]
        lijst = []
        for k, (clip, sid, i, van) in enumerate(shots):
            einde = starts[k + 1] if k + 1 < len(shots) else frames / FPS
            duur = einde - starts[k]
            beschikbaar = clips[clip] - van - 0.05
            rate = min(1.0, beschikbaar / duur)
            assert rate >= 0.6, f"{b} shot {clip} te lang ({duur:.1f}s voor {beschikbaar:.1f}s clip)"
            lijst.append({"clip": clip, "start": round(starts[k], 3), "end": round(einde, 3), "van": van, "rate": round(rate, 4)})
        acc = []
        for k, (typ, sid, i, data) in enumerate(ACCENTS[b]):
            start = woord(t, sid, i)
            sc = scene(t, sid)
            volgende = next(((s2, i2) for (_, s2, i2, _) in ACCENTS[b][k + 1:] if s2 == sid), None)
            einde = woord(t, *volgende) if volgende else (frames / FPS if sid == "cta" else sc["end"] + 0.25)
            d = dict(data)
            for key in ("cues",):
                if key in d:
                    d[key] = [round(woord(t, sid, c) - start, 3) for c in d[key]]
            if "cueB" in d:
                d["cueB"] = round(woord(t, sid, d["cueB"]) - start, 3)
            acc.append({"type": typ, "start": round(start, 3), "end": round(einde, 3), **d})
        sfx = []
        for a in acc:
            if a["type"] in ("stat", "duo", "fases", "termijnen", "trend", "vergelijk", "cta"):
                sfx.append({"file": "accent-pop", "at": a["start"], "vol": 0.35})
            else:
                sfx.append({"file": "accent-whoosh", "at": a["start"], "vol": 0.3})
            for c in a.get("cues", [])[1:]:
                sfx.append({"file": "accent-pop", "at": round(a["start"] + c, 3), "vol": 0.3})
            if a.get("cueB"):
                sfx.append({"file": "accent-pop", "at": round(a["start"] + a["cueB"], 3), "vol": 0.3})
        for s in lijst:
            if s["clip"] in SFEER:
                sfx.append({"file": SFEER[s["clip"]], "at": s["start"], "vol": 0.18, "dur": round(s["end"] - s["start"], 3)})
        plan["bodies"][b] = {"frames": frames, "shots": lijst, "accents": acc, "sfx": sorted(sfx, key=lambda x: x["at"])}
    for key, shots in HOOK_SHOTS.items():
        t = timing[key]
        sc = t["scenes"][0]
        frames = math.ceil((t["duur"] + PAUZE) * FPS)
        starts = [0.0 if k == 0 else sc["words"][i]["s"] for k, (_, i, _) in enumerate(shots)]
        lijst = []
        for k, (clip, i, van) in enumerate(shots):
            einde = starts[k + 1] if k + 1 < len(shots) else frames / FPS
            rate = min(1.0, (clips[clip] - van - 0.05) / (einde - starts[k]))
            assert rate >= 0.6
            lijst.append({"clip": clip, "start": round(starts[k], 3), "end": round(einde, 3), "van": van, "rate": round(rate, 4)})
        tekst, noot = KICKER[key]
        sfx = [{"file": "accent-whoosh", "at": 0.15, "vol": 0.3}]
        for s in lijst:
            if s["clip"] in SFEER:
                sfx.append({"file": SFEER[s["clip"]], "at": s["start"], "vol": 0.18, "dur": round(s["end"] - s["start"], 3)})
        plan["hooks"][key] = {"frames": frames, "shots": lijst, "kicker": {"text": tekst, "note": noot}, "sfx": sfx}
    (ROOT / "src/plan.json").write_text(json.dumps(plan, ensure_ascii=False, indent=1))
    for b, d in plan["bodies"].items():
        print(b, d["frames"], "frames,", len(d["shots"]), "shots,", len(d["accents"]), "accenten")
    print({k: v["frames"] for k, v in plan["hooks"].items()})


if __name__ == "__main__":
    main()

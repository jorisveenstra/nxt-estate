"""scripts/woorden-tts.json (timing per scriptwoord) -> src/timing.json (scènes met woorden per video)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
woorden = json.loads((ROOT / "scripts/woorden-tts.json").read_text())
uit = {}
for key, lijst in woorden.items():
    scenes, huidig = [], None
    for sid, t, s, e in lijst:
        if not huidig or huidig["id"] != sid:
            huidig = {"id": sid, "words": []}
            scenes.append(huidig)
        huidig["words"].append({"t": t, "s": s, "e": e})
    for sc in scenes:
        sc["start"], sc["end"] = sc["words"][0]["s"], sc["words"][-1]["e"]
    uit[key] = {"scenes": scenes, "end": scenes[-1]["end"]}
    print(key, round(uit[key]["end"], 2), [(sc["id"], round(sc["start"], 1)) for sc in scenes])
(ROOT / "src/timing.json").write_text(json.dumps(uit, ensure_ascii=False, indent=1))

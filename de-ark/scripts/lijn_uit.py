"""
Legt de scripttekst over de woordtiming van de voice-over -> src/timing.json.

Per video (b<body>h<hook>): woorden [start, eind, tekst] (de getoonde tekst, bv. "A+++"), het eind van de hook,
het begin van elke zin van de body en van de CTA.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from maak_vo import spreektekst  # noqa: E402

scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
tts = json.loads((ROOT / "scripts/woorden-tts.json").read_text())
uit = {}
for key, spoken in tts.items():
    b, h = key[1:].split("h")
    data = scripts[b]
    hook_tokens = data["hooks"][int(h) - 1].split()
    sentence_tokens = [z.split() for z in data["zinnen"]] + [data["cta"].split()]
    cursor, words, starts = 0, [], []

    def take(tokens, mark=None):
        global cursor
        for tok in tokens:
            n = len(spreektekst(tok).split())
            chunk = spoken[cursor:cursor + n]
            cursor += n
            words.append([chunk[0][0], chunk[-1][1], tok])

    take(hook_tokens)
    hook_end = words[-1][1]
    for toks in sentence_tokens:
        starts.append(len(words))
        take(toks)
    assert cursor == len(spoken), (key, cursor, len(spoken))
    uit[key] = {"words": words, "hookWords": len(hook_tokens), "hookEnd": hook_end,
                "sentenceStarts": starts, "end": words[-1][1]}
(ROOT / "src/timing.json").write_text(json.dumps(uit, ensure_ascii=False))
print(len(uit), "video's uitgelijnd")

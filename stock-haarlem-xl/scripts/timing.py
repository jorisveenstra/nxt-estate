"""Woordtiming uit de ElevenLabs-alignment -> src/timing.json (schermtekst = scripttekst, niet de uitspraak)."""
import json, re, subprocess
from pathlib import Path
from maak_vo import UITSPRAAK

ROOT = Path(__file__).resolve().parent.parent
PAUZE, STAART = 0.35, 2.5


def duur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                                capture_output=True, text=True).stdout)


def spoken_words(al):
    out, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur: out.append((s, e, cur))
            cur, s = "", None
            continue
        if s is None: s = cs
        cur += ch; e = ce
    if cur: out.append((s, e, cur))
    return out


def display_groups(text):
    """[(schermwoorden, aantal gesproken woorden)]"""
    pat = "(" + "|".join(re.escape(k) for k in UITSPRAAK) + ")"
    groups = []
    for part in re.split(pat, text):
        if not part.strip(): 
            continue
        if part in UITSPRAAK:
            groups.append((part.split(), len(UITSPRAAK[part].split())))
        else:
            ws = part.split()
            if groups and not part[0].isspace() and ws and not any(c.isalnum() for c in ws[0]):
                groups[-1][0][-1] += ws.pop(0)  # leesteken direct na een vervangen woord
            groups += [([w], 1) for w in ws]
    return groups


def woorden(naam, teksten):
    """teksten: lijst zinnen; geeft per zin [{t,s,e}]"""
    al = json.loads((ROOT / f"public/vo/{naam}.json").read_text())["alignment"]
    sp = spoken_words(al)
    i, zinnen = 0, []
    for z in teksten:
        ws = []
        for disp, n in display_groups(z):
            chunk = sp[i:i + n]; i += n
            assert chunk, f"{naam}: alignment loopt uit de pas bij '{z}'"
            s, e = chunk[0][0], chunk[-1][1]
            step = (e - s) / len(disp)
            for k, w in enumerate(disp):
                ws.append({"t": w, "s": round(s + k * step, 3), "e": round(s + (k + 1) * step, 3)})
        zinnen.append(ws)
    assert i == len(sp), f"{naam}: {len(sp) - i} gesproken woorden over"
    return zinnen


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    out = {"hooks": {}, "bodies": {}}
    for b, d in scripts.items():
        zinnen = d["zinnen"] + [d["cta"]]
        per = woorden(f"body{b}", zinnen)
        out["bodies"][b] = {"duration": round(duur(ROOT / f"public/vo/body{b}.mp3") + STAART, 3),
                            "sentences": [{"start": ws[0]["s"], "end": ws[-1]["e"], "words": ws} for ws in per]}
        for h, hook in enumerate(d["hooks"], 1):
            ws = woorden(f"b{b}h{h}", [hook])[0]
            out["hooks"][f"{b}-{h}"] = {"duration": round(duur(ROOT / f"public/vo/b{b}h{h}.mp3") + PAUZE, 3), "words": ws}
    (ROOT / "src/timing.json").write_text(json.dumps(out, ensure_ascii=False))
    for b, v in out["bodies"].items():
        print(b, v["duration"], [round(s["end"] - s["start"], 1) for s in v["sentences"]])


if __name__ == "__main__":
    main()

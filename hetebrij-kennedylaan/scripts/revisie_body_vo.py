"""
Revisie (oplevering -> herfst 2027): genereer ALLEEN de drie body-voice-overs opnieuw met
eleven_v4 (zelfde stem, zelfde previous_text als maak_vo.py). Hook-VO's blijven ongewijzigd
(provenance bevestigt eleven_v4). Werkt woorden-tts.json, vo-meta.json en vo-provenance.json bij.
"""
import json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import maak_vo as m

ROOT = m.ROOT


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    m.CACHE.mkdir(parents=True, exist_ok=True)
    jobs = [(b, m.spreek(" ".join(d["zinnen"] + [d["cta"]])), m.spreek(d["hooks"][0])) for b, d in scripts.items()]
    with ThreadPoolExecutor(3) as ex:
        res = list(ex.map(lambda j: (j, m.tts(j[1], j[2], "")), jobs))
    woord = json.loads((ROOT / "scripts/woorden-tts.json").read_text())
    meta = json.loads((ROOT / "scripts/vo-meta.json").read_text())
    prov = json.loads((ROOT / "scripts/vo-provenance.json").read_text())
    oud = {p["part"]: p for p in prov}
    for (b, _, _), (mp3, al, pv) in res:
        uit = ROOT / f"public/vo/b{b}-body.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-ar", "48000", "-ac", "1", str(uit)], check=True)
        meta[f"b{b}"] = {"bodyDur": m.duur(uit)}
        woord[f"b{b}"] = m.woorden(al, 0)
        vorige = oud.get(f"b{b}body", {})
        oud[f"b{b}body"] = {"part": f"b{b}body", **pv, "file": mp3.name, "revision": "oplevering herfst 2027",
                            "replaces_request_id": vorige.get("request_id")}
        print(b, meta[f"b{b}"])
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps(woord, ensure_ascii=False))
    (ROOT / "scripts/vo-meta.json").write_text(json.dumps(meta, indent=1))
    (ROOT / "scripts/vo-provenance.json").write_text(json.dumps(list(oud.values()), ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

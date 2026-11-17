"""
Voice-overs voor Westeinde 41 via ElevenLabs TTS met tijdstempels.
Stem YgjXqgzBJa9op0K278OW (Tijs), model_id "eleven_v4" (expliciet, geen fallback).

Per body één aanvraag (zinnen + CTA), per hook één aanvraag. Antwoorden staan in scripts/tts-cache/<hash>.json
(audio + uitlijning + model/stem/request-id), zodat dezelfde tekst nooit twee keer credits kost.
Uitvoer:
  public/vo/b<B>-body.wav, public/vo/b<B>h<H>-hook.wav
  src/timing.json : per body woorden + zinsgrenzen (relatief t.o.v. body-start), per hook woorden

Gebruik: python3 scripts/maak_vo.py
"""
import base64
import hashlib
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import el  # noqa

ROOT = el.ROOT
CACHE = ROOT / "scripts/tts-cache"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"


def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}}
    if vorige:
        body["previous_text"] = vorige
    if volgende:
        body["next_text"] = volgende
    h = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        key = f"tts:{h}"
        e = el.get_entry(key) or {}
        if e.get("status") == "submitting":
            raise RuntimeError(f"{key}: eerdere aanvraag met onzekere uitkomst; niet blind herhalen")
        el.set_entry(key, status="submitting", at=el.now(), model=MODEL, voice=VOICE, text=tekst)
        st, hdrs, data = el.request("POST", f"/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128", body=body)
        if st >= 300:
            el.set_entry(key, status="rejected", http=st, error=data[:400].decode(errors="replace"))
            raise RuntimeError(f"TTS {st}: {data[:400]!r}")
        lh = {k.lower(): v for k, v in hdrs.items()}
        rid = lh.get("request-id")
        d = json.loads(data)
        d["provenance"] = {"model_id": MODEL, "voice_id": VOICE, "request_id": rid,
                           "history_item_id": lh.get("history-item-id"), "character_cost": lh.get("character-cost")}
        CACHE.mkdir(exist_ok=True)
        pad.write_text(json.dumps(d))
        el.set_entry(key, status="done", request_id=rid, character_cost=lh.get("character-cost"), cache=f"scripts/tts-cache/{h}.json")
        el.record("voiceover", MODEL, rid, hdrs, characters=len(tekst))
        print(f"  gegenereerd ({len(tekst)} tekens, cost {lh.get('character-cost')}): {tekst[:50]}…", flush=True)
    d = json.loads(pad.read_text())
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists():
        mp3.write_bytes(base64.b64decode(d["audio_base64"]))
    return mp3, d["alignment"]


def woorden(al):
    uit, cur, s, e, i0 = [], "", None, None, 0
    for i, (ch, cs, ce) in enumerate(zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"])):
        if ch.isspace():
            if cur:
                uit.append([round(s, 3), round(e, 3), cur, i0])
            cur, s = "", None
            continue
        if s is None:
            s, i0 = cs, i
        cur += ch
        e = ce
    if cur:
        uit.append([round(s, 3), round(e, 3), cur, i0])
    return uit


def wav(mp3, uit):
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(mp3), "-ar", "48000", "-ac", "2", str(uit)], check=True)


def duur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                                capture_output=True, text=True).stdout)


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    (ROOT / "public/vo").mkdir(parents=True, exist_ok=True)
    timing = {}
    jobs = []
    with ThreadPoolExecutor(4) as pool:
        for b, data in scripts.items():
            delen = data["zinnen"] + [data["cta"]]
            body_tekst = " ".join(delen)
            jobs.append((b, None, delen, pool.submit(tts, body_tekst, data["hooks"][0])))
            for h, hook in enumerate(data["hooks"], start=1):
                jobs.append((b, h, None, pool.submit(tts, hook, "", body_tekst[:300])))
        for b, h, delen, fut in jobs:
            mp3, al = fut.result()
            w = woorden(al)
            if h is None:
                uit = ROOT / f"public/vo/{b}-body.wav"
                wav(mp3, uit)
                # zinsgrenzen via tekenposities
                grenzen, pos = [], 0
                for z in delen:
                    grenzen.append((pos, pos + len(z)))
                    pos += len(z) + 1
                zinnen = []
                for zi, (a, z) in enumerate(grenzen):
                    ws = [x for x in w if a <= x[3] < z]
                    zinnen.append({"i": zi, "start": ws[0][0], "end": ws[-1][1], "cta": zi == len(delen) - 1})
                timing.setdefault(b, {})["body"] = {"duur": duur(uit), "woorden": [x[:3] for x in w], "zinnen": zinnen}
            else:
                uit = ROOT / f"public/vo/{b}h{h}-hook.wav"
                wav(mp3, uit)
                timing.setdefault(b, {}).setdefault("hooks", {})[str(h)] = {"duur": duur(uit), "woorden": [x[:3] for x in w]}
    (ROOT / "src/timing.json").write_text(json.dumps(timing, ensure_ascii=False, indent=0))
    for b in timing:
        print(b, "body", round(timing[b]["body"]["duur"], 1), "hooks", [round(v["duur"], 1) for v in timing[b]["hooks"].values()])


if __name__ == "__main__":
    main()

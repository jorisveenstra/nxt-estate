"""
Voice-overs voor Elbe 23 Den Haag via ElevenLabs (stem YgjXqgzBJa9op0K278OW, model eleven_v4, expliciet).

Per body wordt body + CTA één keer ingesproken, per hook alleen de hook. Antwoorden (audio + timing per
teken) worden bewaard in scripts/tts-cache/ zodat dezelfde tekst nooit twee keer credits kost.
Provenance (model_id, voice_id, request-id) staat in public/vo/provenance.json.

Authenticatie: de cloudomgeving injecteert xi-api-key voor api.elevenlabs.io (network secret). Lokaal
kan ELEVENLABS_API_KEY in de omgeving staan. Er wordt nooit een sleutel in de repo geschreven.

Gebruik: python3 scripts/maak_vo.py   (optioneel: --usage-hook <module>  voor kostenrapportage)
"""
import base64
import hashlib
import json
import os
import re
import subprocess
import sys
import threading
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VO = ROOT / "public/vo"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"

# Wat in beeld staat -> wat de stem zegt
UITSPRAAK = [
    ("505.000 euro", "vijfhonderdvijfduizend euro"),
    ("202 tot 230 m²", "tweehonderdtwee tot tweehonderddertig vierkante meter"),
    ("74 tot 117 m²", "vierenzeventig tot honderdzeventien vierkante meter"),
    ("4,4 bij 3,2 meter", "vier komma vier bij drie komma twee meter"),
    ("HR++", "HR plus plus"),
    ("A12 en A4", "A twaalf en A vier"),
    ("Elbe 23", "Elbe drieëntwintig"),
    ("2027", "tweeduizend zevenentwintig"),
]

_lock = threading.Lock()
usage_cb = None  # callable(request_id, headers, characters) – gezet door de runner


def spreek(t):
    for a, b in UITSPRAAK:
        t = t.replace(a, b)
    return t


def tts(naam, tekst):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    h = hashlib.sha1(json.dumps({"v": VOICE, **body}, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    marker = CACHE / f"{h}.pending"
    if not pad.exists():
        if marker.exists():
            raise SystemExit(f"{naam}: eerdere aanvraag had onzekere uitkomst; eerst ElevenLabs-historie controleren")
        marker.write_text(naam)
        headers = {"Content-Type": "application/json", "User-Agent": "video-ads/1.0"}
        if os.environ.get("ELEVENLABS_API_KEY"):
            headers["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                data = json.loads(r.read())
                hdrs = {k.lower(): v for k, v in r.headers.items()}
        except urllib.error.HTTPError as e:
            marker.unlink()  # definitieve afwijzing door de API, geen onzekere uitkomst
            raise SystemExit(f"{naam}: ElevenLabs {e.code}: {e.read(500).decode(errors='replace')}")
        rid = hdrs.get("request-id")
        data["_provenance"] = {"model_id": MODEL, "voice_id": VOICE, "request_id": rid,
                               "history_item_id": hdrs.get("history-item-id"),
                               "credits_charged": hdrs.get("character-cost"), "characters": len(tekst)}
        pad.write_text(json.dumps(data))
        marker.unlink()
        if usage_cb and rid:
            with _lock:
                usage_cb(rid, hdrs, len(tekst))
        print(f"  {naam}: gegenereerd ({len(tekst)} tekens, kosten {hdrs.get('character-cost')})", flush=True)
    data = json.loads(pad.read_text())
    mp3 = VO / f"{naam}.mp3"
    mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return data


def woorden(al):
    """Tekens met tijden -> [[start, eind, woord], ...] (gesproken tekst)"""
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                uit.append([s, e, cur])
            cur, s = "", None
            continue
        if s is None:
            s = cs
        cur += ch
        e = ce
    if cur:
        uit.append([s, e, cur])
    return uit


def zin_timing(zinnen_weergave, al):
    """Per zin begin/eind uit de gesproken woorden; weergavewoorden verdeeld naar tekenpositie."""
    gesproken = woorden(al)
    i = 0
    uit = []
    for z in zinnen_weergave:
        n = len(spreek(z).split())
        ws = gesproken[i:i + n]
        i += n
        disp = z.split()
        # cumulatieve tekenfractie van gesproken woorden -> tijd
        tot = sum(len(w[2]) + 1 for w in ws)
        pts, acc = [], 0
        for w in ws:
            pts.append((acc / tot, w[0]))
            acc += len(w[2]) + 1
            pts.append((acc / tot, w[1]))

        def t_at(f):
            for (f0, t0), (f1, t1) in zip(pts, pts[1:]):
                if f <= f1:
                    return t0 if f1 == f0 else t0 + (t1 - t0) * (f - f0) / (f1 - f0)
            return pts[-1][1]
        dtot = sum(len(w) + 1 for w in disp)
        dw, acc = [], 0
        for w in disp:
            s = t_at(acc / dtot)
            acc += len(w) + 1
            dw.append({"t": w, "s": round(s, 3), "e": round(t_at(acc / dtot), 3)})
        uit.append({"tekst": z, "s": round(ws[0][0], 3), "e": round(ws[-1][1], 3), "words": dw})
    assert i == len(gesproken), f"woordtelling klopt niet: {i} vs {len(gesproken)}"
    return uit


def duur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                                capture_output=True, text=True, check=True).stdout)


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    CACHE.mkdir(parents=True, exist_ok=True)
    VO.mkdir(parents=True, exist_ok=True)
    jobs = []
    for b, d in scripts.items():
        zinnen = d["zinnen"] + [d["cta"]]
        jobs.append((f"body{b}", zinnen))
        for h, hook in enumerate(d["hooks"], 1):
            jobs.append((f"b{b}h{h}", [hook]))

    def run(job):
        naam, zinnen = job
        data = tts(naam, " ".join(spreek(z) for z in zinnen))
        return naam, zin_timing(zinnen, data["alignment"]), data["_provenance"]

    with ThreadPoolExecutor(4) as ex:
        res = list(ex.map(run, jobs))
    timing, prov = {}, {}
    for naam, zt, p in res:
        timing[naam] = {"duur": round(duur(VO / f"{naam}.mp3"), 3), "zinnen": zt}
        prov[naam] = p
    (ROOT / "src/vo.json").write_text(json.dumps(timing, ensure_ascii=False, indent=1))
    (VO / "provenance.json").write_text(json.dumps(prov, indent=1))
    print("klaar:", len(timing), "voice-overs")


if __name__ == "__main__":
    main()

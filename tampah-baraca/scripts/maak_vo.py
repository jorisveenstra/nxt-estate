"""
Voice-overs via ElevenLabs: stem YgjXqgzBJa9op0K278OW (Tijs), model eleven_v4 (verplicht, geen fallback).

Per body wordt body + CTA één keer ingesproken, per hook alleen de hook. Antwoorden (audio + timing per
teken) worden bewaard in scripts/tts-cache/, met herkomst (model, stem, request-id) in
scripts/vo-provenance.json, zodat dezelfde tekst nooit twee keer credits kost.

Authenticatie: de cloudomgeving injecteert xi-api-key voor api.elevenlabs.io (netwerksecret).
Lokaal kan ELEVENLABS_API_KEY in ~/.elevenlabs staan. Er wordt nooit een sleutel weggeschreven.

Optioneel: zet maak_vo.on_usage (callback) om het verbruik per request door te geven.

Gebruik: python3 scripts/maak_vo.py
"""
import base64
import hashlib
import json
import os
import threading
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
PROV = ROOT / "scripts/vo-provenance.json"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
LOCK = threading.Lock()
on_usage = None  # callback(request_id, headers, characters)


def sleutel():
    p = Path.home() / ".elevenlabs"
    if p.exists():
        for regel in p.read_text().splitlines():
            if regel.startswith("ELEVENLABS_API_KEY="):
                return regel.split("=", 1)[1].strip()
    return os.environ.get("ELEVENLABS_API_KEY")


def _prov():
    return json.loads(PROV.read_text()) if PROV.exists() else {}


def tts(naam, tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}}
    if vorige:
        body["previous_text"] = vorige
    if volgende:
        body["next_text"] = volgende
    h = hashlib.sha256(json.dumps({"voice": VOICE, **body}, sort_keys=True).encode()).hexdigest()[:20]
    pad = CACHE / f"{h}.json"
    with LOCK:
        claimed = _prov().get(h)
    if pad.exists():
        return h, pad
    if claimed and claimed.get("status") == "pending":
        raise SystemExit(f"{naam}: eerdere request met onzekere uitkomst ({h}); niet blind herhalen")
    with LOCK:
        p = _prov(); p[h] = {"naam": naam, "status": "pending", "model_id": MODEL, "voice_id": VOICE}
        PROV.write_text(json.dumps(p, indent=1, ensure_ascii=False))
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    k = sleutel()
    if k:
        headers["xi-api-key"] = k
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
        data=json.dumps(body).encode(), headers=headers)
    with urllib.request.urlopen(req, timeout=300) as r:
        data = json.loads(r.read())
        rh = dict(r.headers.items())
    CACHE.mkdir(exist_ok=True)
    pad.write_text(json.dumps(data))
    rid = rh.get("request-id") or rh.get("Request-Id")
    with LOCK:
        p = _prov()
        p[h] = {"naam": naam, "status": "done", "model_id": MODEL, "voice_id": VOICE, "request_id": rid,
                "history_item_id": rh.get("history-item-id"), "character_cost": rh.get("character-cost"),
                "characters": len(tekst), "text": tekst}
        PROV.write_text(json.dumps(p, indent=1, ensure_ascii=False))
    if on_usage and rid:
        on_usage(rid, rh, len(tekst))
    print(f"  {naam}: gegenereerd ({len(tekst)} tekens, kosten {rh.get('character-cost')})")
    return h, pad


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    jobs = []
    for b, d in scripts.items():
        body = " ".join(d["body"] + d["cta"])
        jobs.append((f"{b}-body", body, d["hooks"][0], ""))
        for i, hook in enumerate(d["hooks"], 1):
            jobs.append((f"{b}h{i}-hook", hook, "", body[:300]))
    with ThreadPoolExecutor(4) as ex:
        res = list(ex.map(lambda j: (j[0], tts(*j)), jobs))
    index = {}
    for naam, (h, pad) in res:
        data = json.loads(pad.read_text())
        mp3 = ROOT / f"public/vo/{naam}.mp3"
        mp3.write_bytes(base64.b64decode(data["audio_base64"]))
        (ROOT / f"scripts/tts-cache/{naam}.alignment.json").write_text(json.dumps(data["alignment"]))
        index[naam] = h
    (ROOT / "scripts/vo-index.json").write_text(json.dumps(index, indent=1))


if __name__ == "__main__":
    main()

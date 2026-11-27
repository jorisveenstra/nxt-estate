"""
Voice-overs voor Pattistpark II via ElevenLabs: stem YgjXqgzBJa9op0K278OW, model eleven_v4 (verplicht, geen fallback).

Per body wordt body + CTA één keer ingesproken en per hook alleen de hook (3 bodies + 15 hooks).
De timing per teken komt mee (/with-timestamps) en wordt omgezet naar woorden in scripts/woorden-tts.json.

- Antwoorden staan in scripts/tts-cache/<hash>.json: dezelfde tekst kost nooit twee keer credits.
- Per aanvraag wordt herkomst bewaard in scripts/tts-cache/herkomst.json: model_id, voice_id,
  request-id en de werkelijk gerekende credits (header character-cost). Geen sleutels.
- Authenticatie: in de cloudomgeving injecteert de proxy de xi-api-key; lokaal kan ELEVENLABS_API_KEY
  in ~/.elevenlabs staan.

Gebruik: python3 scripts/maak_vo.py
"""
import base64
import concurrent.futures as cf
import fcntl
import hashlib
import json
import os
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"

# Wat de stem moet zeggen in plaats van wat in het script staat (betekenis blijft gelijk)
UITSPRAAK = {
    "A+++": "A-plus-plus-plus",
    "vloerverwarming en -koeling": "vloerverwarming en vloerkoeling",
}


def spreektekst(t):
    for a, b in UITSPRAAK.items():
        t = t.replace(a, b)
    return t


def sleutel():
    if os.environ.get("ELEVENLABS_API_KEY"):
        return os.environ["ELEVENLABS_API_KEY"]
    p = Path.home() / ".elevenlabs"
    if p.exists():
        for regel in p.read_text().splitlines():
            if regel.startswith("ELEVENLABS_API_KEY="):
                return regel.split("=", 1)[1].strip()
    return None  # cloud: proxy injecteert de sleutel


def herkomst_opslaan(h, info):
    pad = CACHE / "herkomst.json"
    fd = os.open(pad, os.O_CREAT | os.O_RDWR, 0o600)
    with os.fdopen(fd, "r+", encoding="utf8") as f:
        fcntl.flock(f.fileno(), fcntl.LOCK_EX)
        raw = f.read()
        data = json.loads(raw) if raw else {}
        data[h] = info
        f.seek(0)
        f.truncate()
        json.dump(data, f, indent=1, ensure_ascii=False)


def tts(tekst):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    h = hashlib.sha1(json.dumps({**body, "voice": VOICE}, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        lock = CACHE / f"{h}.inflight"
        if lock.exists():
            raise SystemExit(f"Onzekere eerdere aanvraag voor {h}; niet blind herhalen. Controleer de ElevenLabs-historie.")
        lock.write_text("")
        headers = {"Content-Type": "application/json"}
        k = sleutel()
        if k:
            headers["xi-api-key"] = k
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                raw = r.read()
                hdr = {k.lower(): v for k, v in r.headers.items()}
        except urllib.error.HTTPError as e:
            lock.unlink()  # definitieve weigering, geen levering
            raise SystemExit(f"ElevenLabs weigerde TTS ({e.code}): {e.read(500).decode(errors='replace')}")
        data = json.loads(raw)
        pad.write_text(json.dumps(data))
        herkomst_opslaan(h, {
            "model_id": MODEL, "voice_id": VOICE, "text": tekst, "characters": len(tekst),
            "request_id": hdr.get("request-id"), "history_item_id": hdr.get("history-item-id"),
            "character_cost": hdr.get("character-cost"),
        })
        lock.unlink()
        print(f"  gegenereerd ({len(tekst)} tekens, credits {hdr.get('character-cost')}): {tekst[:60]}…", flush=True)
    data = json.loads(pad.read_text())
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists():
        mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return h, mp3, data["alignment"]


def woorden(al):
    """Tekens met tijden -> [[start, eind, woord], ...]"""
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                uit.append([round(s, 3), round(e, 3), cur])
            cur, s = "", None
            continue
        if s is None:
            s = cs
        cur += ch
        e = ce
    if cur:
        uit.append([round(s, 3), round(e, 3), cur])
    return uit


def main():
    CACHE.mkdir(exist_ok=True)
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    taken = {}
    for b, data in scripts.items():
        taken[f"{b}"] = spreektekst(" ".join(z for _, z in data["zinnen"]))
        for h, hook in enumerate(data["hooks"], start=1):
            taken[f"{b}h{h}"] = spreektekst(hook)
    with cf.ThreadPoolExecutor(4) as ex:
        res = dict(zip(taken, ex.map(tts, taken.values())))
    uit = {}
    for key, (h, mp3, al) in res.items():
        uit[key] = {"cache": h, "mp3": str(mp3.relative_to(ROOT)), "words": woorden(al)}
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps(uit, ensure_ascii=False, indent=1))
    print(f"{len(uit)} voice-overdelen klaar")


if __name__ == "__main__":
    main()

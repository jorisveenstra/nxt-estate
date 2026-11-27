"""
Maakt de voice-overs met ElevenLabs (stem YgjXqgzBJa9op0K278OW, model eleven_v4 — expliciet, geen fallback).

Per body wordt body + CTA één keer ingesproken en per hook alleen de hook. ElevenLabs levert timing per teken,
waaruit src/timing.json wordt opgebouwd (woorden en zinsgrenzen per stuk).

Antwoorden staan in scripts/tts-cache/ (audio + alignment + provenance: model_id, voice_id, request-id),
zodat dezelfde tekst nooit twee keer credits kost. Sleutel: cloud-netwerk-secret of ~/.elevenlabs.
Gebruik: python3 scripts/maak_vo.py   (optioneel USAGE_HOOK=<pad> voor kostenrapportage)
"""
import base64
import hashlib
import json
import os
import subprocess
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
UITSPRAAK = {"2027": "tweeduizend zevenentwintig"}


def spreek(t):
    for a, b in UITSPRAAK.items():
        t = t.replace(a, b)
    return t


def headers():
    h = {"Content-Type": "application/json"}
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key and (Path.home() / ".elevenlabs").exists():
        for r in (Path.home() / ".elevenlabs").read_text().splitlines():
            if r.startswith("ELEVENLABS_API_KEY="):
                key = r.split("=", 1)[1].strip()
    if key:
        h["xi-api-key"] = key
    return h


def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}}
    if vorige:
        body["previous_text"] = vorige
    if volgende:
        body["next_text"] = volgende
    h = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers=headers())
        with urllib.request.urlopen(req, timeout=300) as r:
            hdrs = {k.lower(): v for k, v in r.headers.items()}
            data = json.loads(r.read())
        prov = {"model_id": MODEL, "voice_id": VOICE, "request_id": hdrs.get("request-id"),
                "history_item_id": hdrs.get("history-item-id"), "character_cost": hdrs.get("character-cost"),
                "text": tekst}
        data["provenance"] = prov
        CACHE.mkdir(exist_ok=True)
        pad.write_text(json.dumps(data))
        print(f"  gegenereerd ({len(tekst)} tekens, cost {prov['character_cost']}): {tekst[:50]}…", flush=True)
        hook = os.environ.get("USAGE_HOOK")
        if hook and prov["request_id"]:
            subprocess.run([sys.executable, "-I", hook, "voiceover", MODEL, prov["request_id"],
                            json.dumps({k: v for k, v in hdrs.items() if k in ("request-id", "character-cost")}),
                            json.dumps({"characters": len(tekst)})], check=False)
    data = json.loads(pad.read_text())
    assert data["provenance"]["model_id"] == "eleven_v4"
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists():
        mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"]


def woorden(al, zinnen):
    """-> woorden [[start, eind, woord]] en zinsgrenzen [[start, eind]] (in tekst zoals getoond)."""
    chars, cs, ce = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    tekst = "".join(chars)
    uit, cur, s, e = [], "", None, None
    for ch, a, b in zip(chars, cs, ce):
        if ch.isspace():
            if cur:
                uit.append([round(s, 3), round(e, 3), cur])
            cur, s = "", None
            continue
        if s is None:
            s = a
        cur += ch
        e = b
    if cur:
        uit.append([round(s, 3), round(e, 3), cur])
    # spreektekst terug naar getoonde tekst
    samen = []
    for w in uit:
        if samen and samen[-1][2] == "tweeduizend" and w[2].startswith("zevenentwintig"):
            samen[-1] = [samen[-1][0], w[1], "2027" + w[2][len("zevenentwintig"):]]
        else:
            samen.append(w)
    grenzen, pos = [], 0
    for z in zinnen:
        i = tekst.find(spreek(z), pos)
        j = i + len(spreek(z)) - 1
        grenzen.append([round(cs[i], 3), round(ce[j], 3)])
        pos = j
    return samen, grenzen


def duur(pad):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(pad)],
                                capture_output=True, text=True).stdout)


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    (ROOT / "public/vo").mkdir(parents=True, exist_ok=True)
    taken = []
    for b, d in scripts.items():
        zinnen = d["zinnen"] + [d["cta"]]
        body = " ".join(zinnen)
        taken.append((f"{b}", body, zinnen, spreek(d["hooks"][0]), ""))
        for h, hook in enumerate(d["hooks"], 1):
            taken.append((f"{b}h{h}", hook, [hook], "", spreek(body[:300])))

    def doe(t):
        key, tekst, zinnen, vorige, volgende = t
        mp3, al = tts(spreek(tekst), vorige, volgende)
        w, g = woorden(al, zinnen)
        wav = ROOT / f"public/vo/{key}.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-af", "loudnorm=I=-16:TP=-1.5:LRA=9", "-ar", "48000", str(wav)], check=True)
        return key, {"woorden": w, "zinnen": g, "duur": round(duur(wav), 3), "tekst": zinnen}

    with ThreadPoolExecutor(4) as pool:
        res = dict(pool.map(doe, taken))
    (ROOT / "src/vo.json").write_text(json.dumps(res, ensure_ascii=False))
    for k, v in res.items():
        print(k, v["duur"])


if __name__ == "__main__":
    main()

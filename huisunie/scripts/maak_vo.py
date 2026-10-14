"""
Maakt de voice-overs met ElevenLabs (stem YgjXqgzBJa9op0K278OW, model eleven_v4).

Per body wordt de body + CTA één keer gegenereerd en per hook alleen de hook; daarna wordt per video
hook + korte pauze + body aan elkaar geplakt. ElevenLabs levert de timing per teken mee, waaruit
scripts/woorden-tts.json (timing per woord) wordt opgebouwd voor scripts/lijn_uit.py.

Antwoorden worden bewaard in scripts/tts-cache/, zodat dezelfde tekst nooit twee keer credits kost.
API-sleutel: ELEVENLABS_API_KEY in ~/.elevenlabs

Gebruik: python3 scripts/maak_vo.py
"""
import base64
import hashlib
import json
import os
import subprocess
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
PAUZE = 0.35  # seconden tussen hook en body

# Uitspraak: wat in beeld staat vs. wat de stem moet zeggen
UITSPRAAK = {"Huisunie.nl": "Huisunie punt nl"}


def spreektekst(t):
    for a, b in UITSPRAAK.items():
        t = t.replace(a, b)
    return t


def sleutel():
    for regel in Path.home().joinpath(".elevenlabs").read_text().splitlines():
        if regel.startswith("ELEVENLABS_API_KEY="):
            return regel.split("=", 1)[1].strip()
    raise SystemExit("Geen ELEVENLABS_API_KEY in ~/.elevenlabs")


def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige:
        body["previous_text"] = vorige
    if volgende:
        body["next_text"] = volgende
    h = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(),
            headers={"xi-api-key": sleutel(), "Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.loads(r.read())
        CACHE.mkdir(exist_ok=True)
        pad.write_text(json.dumps(data))
        print(f"  gegenereerd ({len(tekst)} tekens): {tekst[:60]}…")
    data = json.loads(pad.read_text())
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists():
        mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"]


def woorden(al, offset):
    """Tekens met tijden -> [[start, eind, woord], ...]"""
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                uit.append([round(s + offset, 3), round(e + offset, 3), cur])
            cur, s = "", None
            continue
        if s is None:
            s = cs
        cur += ch
        e = ce
    if cur:
        uit.append([round(s + offset, 3), round(e + offset, 3), cur])
    return uit


def duur(pad):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(pad)], capture_output=True, text=True).stdout)


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    alle = {}
    (ROOT / "public/vo").mkdir(exist_ok=True)
    for b, data in scripts.items():
        body_tekst = spreektekst(" ".join(z for _, z in data["zinnen"]))
        body_mp3, body_al = tts(body_tekst, vorige=spreektekst(data["hooks"][0]))
        for h, hook in enumerate(data["hooks"], start=1):
            key = f"{b}h{h}"
            hook_mp3, hook_al = tts(spreektekst(hook), volgende=body_tekst[:300])
            hd = duur(hook_mp3)
            start_body = hd + PAUZE
            alle[key] = woorden(hook_al, 0) + woorden(body_al, start_body)
            uit = ROOT / f"public/vo/{key}.wav"
            subprocess.run(
                ["ffmpeg", "-v", "error", "-y", "-i", str(hook_mp3), "-i", str(body_mp3), "-filter_complex",
                 f"[0]apad=pad_dur={PAUZE}[a];[a][1]concat=n=2:v=0:a=1,loudnorm=I=-14:TP=-1:LRA=9", "-ar", "48000", str(uit)],
                check=True,
            )
            print(f"{key}: hook {hd:.1f}s + body {duur(body_mp3):.1f}s -> {duur(uit):.1f}s")
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps(alle, ensure_ascii=False))


if __name__ == "__main__":
    main()

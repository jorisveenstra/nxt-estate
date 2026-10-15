"""
Maakt de voice-overs met ElevenLabs (stem Tijs, Nederlands) en de woordtiming voor de video's.

Per body wordt body + CTA één keer gegenereerd en per hook alleen de hook; per video wordt
hook + korte pauze + body aan elkaar geplakt. ElevenLabs levert de timing per teken mee; daaruit
komt src/timing.json (scènes met timing per woord). In beeld staat de scripttekst, de stem krijgt
een uitspraakversie met hetzelfde aantal woorden.

Antwoorden worden bewaard in scripts/tts-cache/, zodat dezelfde tekst nooit twee keer credits kost.
Authenticatie: ELEVENLABS_API_KEY in de omgeving of ~/.elevenlabs; zonder sleutel wordt geen header
meegestuurd (op Claude cloud voegt het netwerk-secret xi-api-key zelf toe).

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
MODEL = os.environ.get("TTS_MODEL", "eleven_v3")
PAUZE = 0.35
HOOKS_PER_BODY = 3

UITSPRAAK = {
    "A27": "A-zevenentwintig",
    "N417": "N-vierhonderdzeventien",
    "495.000": "vierhonderdvijfennegentigduizend",
    "2027": "tweeduizendzevenentwintig",
}


def spreektekst(t):
    return " ".join(_w(w) for w in t.split())


def _w(w):
    kaal = w.rstrip(".,?!")
    return UITSPRAAK[kaal] + w[len(kaal):] if kaal in UITSPRAAK else w


def sleutel():
    k = os.environ.get("ELEVENLABS_API_KEY")
    p = Path.home() / ".elevenlabs"
    if not k and p.exists():
        for regel in p.read_text().splitlines():
            if regel.startswith("ELEVENLABS_API_KEY="):
                k = regel.split("=", 1)[1].strip()
    return k


def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige and MODEL != "eleven_v3":
        body["previous_text"] = vorige
    if volgende and MODEL != "eleven_v3":
        body["next_text"] = volgende
    h = hashlib.sha1(json.dumps([VOICE, body], sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        headers = {"Content-Type": "application/json"}
        if sleutel():
            headers["xi-api-key"] = sleutel()
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers=headers)
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
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                uit.append([s + offset, e + offset])
            cur, s = "", None
            continue
        if s is None:
            s = cs
        cur += ch
        e = ce
    if cur:
        uit.append([s + offset, e + offset])
    return uit


def duur(pad):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(pad)], capture_output=True, text=True).stdout)


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    timing = {}
    (ROOT / "public/vo").mkdir(exist_ok=True)
    for b, data in scripts.items():
        body_tekst = " ".join(z for _, z in data["zinnen"])
        body_mp3, body_al = tts(spreektekst(body_tekst), vorige=spreektekst(data["hooks"][0]))
        bt = woorden(body_al, 0)
        assert len(bt) == len(body_tekst.split()), (b, len(bt), len(body_tekst.split()))
        for h, hook in enumerate(data["hooks"][:HOOKS_PER_BODY], start=1):
            key = f"{b}h{h}"
            hook_mp3, hook_al = tts(spreektekst(hook), volgende=spreektekst(body_tekst)[:300])
            hd = duur(hook_mp3)
            off = hd + PAUZE
            ht = woorden(hook_al, 0)
            assert len(ht) == len(hook.split()), (key, len(ht), len(hook.split()))
            scenes = [{"id": "hook", "words": [{"t": t, "s": round(s, 3), "e": round(e, 3)} for t, (s, e) in zip(hook.split(), ht)]}]
            i = 0
            for sid, z in data["zinnen"]:
                ws = z.split()
                scenes.append({"id": sid, "words": [{"t": t, "s": round(s + off, 3), "e": round(e + off, 3)} for t, (s, e) in zip(ws, bt[i:i + len(ws)])]})
                i += len(ws)
            for k, sc in enumerate(scenes):
                sc["start"] = sc["words"][0]["s"]
                sc["end"] = sc["words"][-1]["e"]
            timing[key] = {"scenes": scenes, "end": scenes[-1]["end"]}
            uit = ROOT / f"public/vo/{key}.wav"
            subprocess.run(
                ["ffmpeg", "-v", "error", "-y", "-i", str(hook_mp3), "-i", str(body_mp3), "-filter_complex",
                 f"[0]apad=pad_dur={PAUZE}[a];[a][1]concat=n=2:v=0:a=1,loudnorm=I=-14:TP=-1:LRA=9", "-ar", "48000", str(uit)],
                check=True)
            print(f"{key}: hook {hd:.1f}s + body {duur(body_mp3):.1f}s -> {duur(uit):.1f}s")
    (ROOT / "src/timing.json").write_text(json.dumps(timing, ensure_ascii=False))


if __name__ == "__main__":
    main()

"""
Voice-overs met ElevenLabs: stem YgjXqgzBJa9op0K278OW (Tijs), model_id=eleven_v4 (expliciet, geen fallback).

Per body wordt body + CTA één keer gegenereerd, per hook alleen de hook. Per video wordt hook + pauze + body
aan elkaar geplakt. Timing per woord komt uit de ElevenLabs-tekentiming (with-timestamps) ->
scripts/woorden-tts.json. Antwoorden staan in scripts/tts-cache/ (provenance incl. model_id/voice_id/request-id),
zodat dezelfde tekst nooit twee keer credits kost. Authenticatie: de proxy voegt xi-api-key toe.
"""
import base64, hashlib, json, subprocess, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
PAUZE = 0.35

UITSPRAAK = {"A12 en A4": "A twaalf en A vier", "4,4 meter": "vier komma vier meter"}


def spreektekst(t):
    for a, b in UITSPRAAK.items():
        t = t.replace(a, b)
    return t


def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige:
        body["previous_text"] = vorige
    if volgende:
        body["next_text"] = volgende
    h = hashlib.sha1(json.dumps({**body, "voice": VOICE}, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.loads(r.read())
            data["provenance"] = {"model_id": MODEL, "voice_id": VOICE, "request_id": r.headers.get("request-id") or r.headers.get("x-request-id"), "text": tekst}
        CACHE.mkdir(exist_ok=True)
        pad.write_text(json.dumps(data))
        print(f"  gegenereerd ({len(tekst)} tekens): {tekst[:60]}", flush=True)
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
    alle, prov = {}, {}
    (ROOT / "public/vo").mkdir(exist_ok=True)
    for b, data in scripts.items():
        body_tekst = spreektekst(" ".join(z for _, z in data["zinnen"]))
        body_mp3, body_al = tts(body_tekst, vorige=spreektekst(data["hooks"][0]))
        for h, hook in enumerate(data["hooks"], start=1):
            key = f"{b}h{h}"
            hook_mp3, hook_al = tts(spreektekst(hook), volgende=body_tekst[:300])
            hd = duur(hook_mp3)
            alle[key] = woorden(hook_al, 0) + woorden(body_al, hd + PAUZE)
            # hook en body als aparte stukken (hook-render apart, body-render één keer per body)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(hook_mp3), "-af", "loudnorm=I=-14:TP=-1:LRA=9", "-ar", "48000", str(ROOT / f"public/vo/{b}h{h}-hook.wav")], check=True)
            print(f"{key}: hook {hd:.1f}s, body {duur(body_mp3):.1f}s", flush=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(body_mp3), "-af", "loudnorm=I=-14:TP=-1:LRA=9", "-ar", "48000", str(ROOT / f"public/vo/{b}-body.wav")], check=True)
        alle[f"{b}_body_alignment"] = woorden(body_al, 0)
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps(alle, ensure_ascii=False))
    (ROOT / "scripts/vo-provenance.json").write_text(json.dumps({"model_id": MODEL, "voice_id": VOICE, "voice_name": "Tijs - Engaging Podcast Host", "note": "request-ids in scripts/tts-cache/*.json (provenance)"}, indent=1))


if __name__ == "__main__":
    main()

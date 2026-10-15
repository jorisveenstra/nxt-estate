"""
Voice-overs via ElevenLabs (stem YgjXqgzBJa9op0K278OW, model eleven_v4 — expliciet, geen fallback).

Per body wordt body + CTA één keer ingesproken en per hook alleen de hook; daarna wordt per video
hook + korte pauze + body aan elkaar geplakt. Timing per woord komt uit de tekentijden van ElevenLabs
(scripts/woorden-tts.json) voor scripts/lijn_uit.py. Antwoorden worden gecachet in scripts/tts-cache/
(zonder credentials, met model_id/voice_id/request-id als herkomst).
Authenticatie: de omgeving injecteert xi-api-key voor api.elevenlabs.io.
"""
import base64, hashlib, json, subprocess, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
PAUZE = 0.35  # seconden tussen hook en body

# Uitspraak: wat in beeld staat vs. wat de stem moet zeggen (aantal woorden blijft gelijk)
UITSPRAAK = {"HR++": "ha-er-plus-plus", "m²": "vierkante meter"}


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
    h = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.loads(r.read())
            rid = {k: v for k, v in r.headers.items() if k.lower() in ("request-id", "x-request-id", "history-item-id")}
        data["herkomst"] = {"model_id": MODEL, "voice_id": VOICE, "request": {k: v for k, v in body.items() if k != "text"},
                            "response_headers": rid}
        CACHE.mkdir(exist_ok=True)
        pad.write_text(json.dumps(data))
        print(f"  gegenereerd ({len(tekst)} tekens): {tekst[:60]}…", flush=True)
    data = json.loads(pad.read_text())
    assert data["herkomst"]["model_id"] == "eleven_v4"
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
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(pad)],
                                capture_output=True, text=True).stdout)


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    (ROOT / "public/vo").mkdir(exist_ok=True)
    body_out, hook_out = {}, {}
    for b, data in scripts.items():
        body_tekst = spreektekst(" ".join(z for _, z in data["zinnen"]))
        body_mp3, body_al = tts(body_tekst, vorige=spreektekst(data["hooks"][0]))
        bw = woorden(body_al, 0)
        body_out[b] = {"words": bw, "duur": duur(body_mp3)}
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(body_mp3), "-af", "loudnorm=I=-16:TP=-1.5:LRA=9", "-ar", "48000",
                        str(ROOT / f"public/vo/{b}-body.wav")], check=True)
        for h, hook in enumerate(data["hooks"], start=1):
            hook_mp3, hook_al = tts(spreektekst(hook), volgende=body_tekst[:300])
            hook_out[f"{b}h{h}"] = {"words": woorden(hook_al, 0), "duur": duur(hook_mp3)}
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(hook_mp3), "-af", "loudnorm=I=-16:TP=-1.5:LRA=9", "-ar", "48000",
                            str(ROOT / f"public/vo/{b}h{h}-hook.wav")], check=True)
            print(f"{b}h{h}: hook {hook_out[f'{b}h{h}']['duur']:.1f}s, body {body_out[b]['duur']:.1f}s", flush=True)
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps({"body": body_out, "hook": hook_out, "pauze": PAUZE}, ensure_ascii=False))


if __name__ == "__main__":
    main()

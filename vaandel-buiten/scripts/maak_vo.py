"""
Maakt de voice-overs met ElevenLabs: stem Tijs (YgjXqgzBJa9op0K278OW), model eleven_v4 (expliciet, geen fallback).
Per body wordt body + CTA een keer gegenereerd, per hook alleen de hook. Daarna wordt per video
hook + korte pauze + body aan elkaar geplakt. ElevenLabs levert timing per teken -> scripts/woorden-tts.json.

Authenticatie: netwerk-secret die xi-api-key injecteert (geen sleutel in de repo).
Antwoorden (zonder credentials) staan in scripts/tts-cache/; request-id's en response-headers in source-assets/vo-meta/.
Gebruik: python3 scripts/maak_vo.py
"""
import base64, hashlib, json, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
META = ROOT / "source-assets/vo-meta"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
PAUZE = 0.45  # seconden tussen hook en body


def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige:
        body["previous_text"] = vorige
    if volgende:
        body["next_text"] = volgende
    h = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        CACHE.mkdir(exist_ok=True, parents=True)
        META.mkdir(exist_ok=True, parents=True)
        r = subprocess.run(["curl", "-sS", "-D", "-", "-X", "POST", f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
                            "-H", "Content-Type: application/json", "-d", json.dumps(body)], capture_output=True, text=True, check=True)
        head, _, resp = r.stdout.rpartition("\n\n")
        headers = {}
        for line in head.splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                headers[k.strip().lower()] = v.strip()
        data = json.loads(resp)
        if "audio_base64" not in data:
            raise SystemExit("TTS mislukt: " + resp[:300])
        pad.write_text(json.dumps(data))
        (META / f"{h}.json").write_text(json.dumps({"hash": h, "model": MODEL, "voice_id": VOICE, "characters": len(tekst),
                                                    "request_id": headers.get("request-id", ""), "character_cost": headers.get("character-cost", ""),
                                                    "headers": {k: v for k, v in headers.items() if k in ("request-id", "character-cost")}, "text": tekst}, ensure_ascii=False, indent=1))
        print(f"  gegenereerd ({len(tekst)} tekens): {tekst[:60]}...", flush=True)
    data = json.loads(pad.read_text())
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists():
        mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"], h


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
    out = {}
    (ROOT / "public/vo").mkdir(parents=True, exist_ok=True)
    for b, data in scripts.items():
        body_tekst = " ".join(z for _, z in data["zinnen"])
        body_mp3, body_al, bh = tts(body_tekst, vorige=data["hooks"][0])
        body_wav = ROOT / f"public/vo/{b}-body.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(body_mp3), "-ar", "48000", str(body_wav)], check=True)
        out[f"{b}-body"] = {"words": woorden(body_al, 0), "duration": duur(body_wav), "cache": bh}
        for h, hook in enumerate(data["hooks"], start=1):
            hook_mp3, hook_al, hh = tts(hook, volgende=body_tekst[:300])
            hd = duur(hook_mp3)
            hook_wav = ROOT / f"public/vo/{b}h{h}-hook.wav"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(hook_mp3), "-ar", "48000", str(hook_wav)], check=True)
            out[f"{b}h{h}-hook"] = {"words": woorden(hook_al, 0), "duration": duur(hook_wav), "pauze": PAUZE, "cache": hh}
            print(f"{b}h{h}: hook {hd:.1f}s, body {out[f'{b}-body']['duration']:.1f}s", flush=True)
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()

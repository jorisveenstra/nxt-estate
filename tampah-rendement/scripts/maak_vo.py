"""
Voice-overs via ElevenLabs (stem YgjXqgzBJa9op0K278OW, model eleven_v4, expliciet).
Body + CTA één keer per body, elke hook apart. Antwoorden (incl. alignment) staan in scripts/tts-cache/
met model_id/voice_id; zo kost dezelfde tekst nooit twee keer credits. Authenticatie: de proxy zet xi-api-key.
Schrijft public/vo/{b1,b2}-body.mp3, public/vo/b?-h?.mp3 en scripts/woorden.json (woordtiming per fragment).
"""
import base64, hashlib, json, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VOICE, MODEL = "YgjXqgzBJa9op0K278OW", "eleven_v4"


def tts(tekst):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    h = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                rid = r.headers.get("request-id")
                data = json.loads(r.read())
        except urllib.error.HTTPError as e:
            raise SystemExit(f"ElevenLabs TTS fout {e.code}: {e.read()[:300]!r}")
        data["meta"] = {"model_id": MODEL, "voice_id": VOICE, "request_id": rid, "chars": len(tekst)}
        CACHE.mkdir(exist_ok=True)
        pad.write_text(json.dumps(data))
        print("gegenereerd", len(tekst), tekst[:50])
    return json.loads(pad.read_text())


def woorden(al):
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur: uit.append([round(s, 3), round(e, 3), cur])
            cur, s = "", None
            continue
        if s is None: s = cs
        cur += ch; e = ce
    if cur: uit.append([round(s, 3), round(e, 3), cur])
    return uit


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    (ROOT / "public/vo").mkdir(exist_ok=True)
    out = {}
    for b, d in scripts.items():
        zinnen = [z for _, z in d["zinnen"]]
        data = tts(" ".join(zinnen))
        (ROOT / f"public/vo/{b}-body.mp3").write_bytes(base64.b64decode(data["audio_base64"]))
        out[f"{b}-body"] = woorden(data["alignment"])
        for i, hook in enumerate(d["hooks"], 1):
            data = tts(hook)
            (ROOT / f"public/vo/{b}-h{i}.mp3").write_bytes(base64.b64decode(data["audio_base64"]))
            out[f"{b}-h{i}"] = woorden(data["alignment"])
    (ROOT / "scripts/woorden.json").write_text(json.dumps(out, ensure_ascii=False))


main()

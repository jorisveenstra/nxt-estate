"""
Maakt één instrumentale, opbeurende muziekstem (ElevenLabs Music, music_v1) die voor alle 15 video's wordt hergebruikt.
Het antwoord (request-id, song-id) staat in scripts/gen/muziek.json; er wordt nooit een tweede keer gegenereerd.
"""
import json, os, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, os.environ["NXT_SCRATCH"])
from prog import get  # noqa: E402

BRIDGE = get()
led = ROOT / "scripts/gen/muziek.json"
out = ROOT / "public/muziek/goffaert-opbeurend.mp3"
if led.exists():
    raise SystemExit("muziek is al aangevraagd; niet opnieuw genereren (zie scripts/gen/muziek.json)")
body = {
    "model_id": "music_v1",
    "prompt": ("Uplifting, warm and positive instrumental background music for a premium residential real-estate ad in Alkmaar: "
               "soft piano, light acoustic guitar, gentle strings and subtle percussion, steady mid tempo, hopeful and welcoming. "
               "No vocals, no lyrics."),
    "force_instrumental": True,
    "music_length_ms": 60000,
}
led.write_text(json.dumps({"uncertain": True, "body": body}))
req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", data=json.dumps(body).encode(),
                             headers={"xi-api-key": "proxy-injected", "Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=600) as r:
    audio = r.read()
    hdr = {k.lower(): v for k, v in r.headers.items()}
out.write_bytes(audio)
keep = {k: v for k, v in hdr.items() if k in ("request-id", "character-cost", "song-id")}
led.write_text(json.dumps({"headers": keep, "body": body, "model_id": "music_v1"}))
print("muziek klaar", keep, len(audio))
rid = keep.get("request-id")
if rid:
    BRIDGE.record_elevenlabs("music", "music_v1", rid, headers=keep, seconds=60)
else:
    print("geen request-id in headers; gebruik te herleiden via song-id", keep.get("song-id"))

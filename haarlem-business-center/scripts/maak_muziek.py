"""
Eén instrumentale, opbeurende muziekstem via ElevenLabs Music (music_v1), hergebruikt voor alle 15 video's.
Instellingen en request-id's komen in public/muziek/muziek.json (geen credentials).
Authenticatie: de omgeving injecteert xi-api-key voor api.elevenlabs.io.
"""
import json, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UIT = ROOT / "public/muziek"
PROMPT = ("Uplifting, positive, modern instrumental background music for a premium commercial real estate advertisement: "
          "warm light piano and plucked guitar, soft airy synth pads, gentle driving percussion, confident and optimistic, "
          "builds gently, clean mix leaving space for a voice-over, no vocals, no lyrics.")
body = {"prompt": PROMPT, "music_length_ms": 75000, "model_id": "music_v1", "force_instrumental": True}
if (UIT / "muziek.mp3").exists():
    raise SystemExit("muziek bestaat al; niet opnieuw betalen")
UIT.mkdir(exist_ok=True)
req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", data=json.dumps(body).encode(),
                             headers={"Content-Type": "application/json"}, method="POST")
with urllib.request.urlopen(req, timeout=600) as r:
    (UIT / "muziek.mp3").write_bytes(r.read())
    ids = {k: v for k, v in r.headers.items() if k.lower() in ("request-id", "x-request-id", "song-id", "history-item-id")}
(UIT / "muziek.json").write_text(json.dumps({"request": body, "response_headers": ids}, indent=1))
print("klaar", ids)

"""Uplifting instrumentale muziek via ElevenLabs Music (music_v1). Eén stem voor alle varianten."""
import json, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
body = {"model_id": "music_v1", "force_instrumental": True, "music_length_ms": 72000,
        "prompt": "Uplifting, positive, warm instrumental background music for a premium real-estate business ad: light acoustic guitar, soft piano, gentle driving percussion, airy synth pads, optimistic and confident, steady mid-tempo, no vocals, no lyrics, leaves room for a voice-over"}
req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=600) as r:
    audio = r.read(); ids = {k: v for k, v in r.headers.items() if "id" in k.lower()}
(ROOT / "public/muziek/muziek.mp3").write_bytes(audio)
(ROOT / "public/muziek/muziek.json").write_text(json.dumps({"request": body, "response_headers": ids}, indent=1))
print(len(audio), ids)

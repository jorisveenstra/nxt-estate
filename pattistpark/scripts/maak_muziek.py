"""Eén instrumentale muziekstem (ElevenLabs Music, music_v1) voor alle varianten; per video wordt hij in Remotion bijgesneden en verzacht."""
import json, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
import sys
LENGTE = int(sys.argv[1]) if len(sys.argv) > 1 else 45000
uit = ROOT / ("public/muziek/muziek.mp3" if LENGTE == 45000 else f"public/muziek/muziek-{LENGTE // 1000}s.mp3")
body = {"model_id": "music_v1", "force_instrumental": True, "music_length_ms": LENGTE,
        "prompt": "Uplifting, warm and positive instrumental background music for a real estate video about calm, carefree living by the sea in Zeeland. "
                  "Gentle acoustic guitar and soft piano, light airy strings, mellow steady pulse, hopeful and optimistic, no vocals, no lyrics, understated so a voice-over can sit on top."}
if not uit.exists():
    req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=600) as r:
        uit.parent.mkdir(parents=True, exist_ok=True)
        uit.write_bytes(r.read())
        song = r.headers.get("song-id")
        rid = r.headers.get("request-id")
    (ROOT / ("scripts/muziek-herkomst.json" if LENGTE == 45000 else f"scripts/muziek-herkomst-{LENGTE // 1000}s.json")).write_text(json.dumps({**body, "song_id": song, "request_id": rid}, indent=1))
print(uit.stat().st_size)

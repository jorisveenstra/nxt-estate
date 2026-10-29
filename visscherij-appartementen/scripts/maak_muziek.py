import json, sys, urllib.request
from pathlib import Path
sys.path.insert(0, "/tmp/claude-0/work")
import helper
ROOT = Path(__file__).resolve().parent.parent
body = {"prompt": "Uplifting, warm, positive instrumental background music for a modern new-build apartment advertisement in a Dutch harbour town. Light acoustic guitar, soft piano, gentle percussion, steady optimistic groove, no vocals, no lyrics, quiet and unobtrusive under a voice-over.",
        "music_length_ms": 62000, "model_id": "music_v1", "force_instrumental": True}
req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", json.dumps(body).encode(), {"Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=600) as r:
    audio = r.read(); hd = {k.lower(): v for k, v in r.headers.items()}
(ROOT / "public/music/muziek.mp3").write_bytes(audio)
meta = {"request": {k: v for k, v in body.items()}, "request_id": hd.get("request-id"), "song_id": hd.get("song-id"), "character_cost": hd.get("character-cost")}
(ROOT / "public/music/muziek.json").write_text(json.dumps(meta, indent=1))
print(meta, len(audio))
b = helper.get()
print(b.record_elevenlabs("music", "music_v1", hd["request-id"], headers=hd, seconds=62))

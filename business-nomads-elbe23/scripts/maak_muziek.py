"""Uplifting instrumentale muziek via ElevenLabs Music (music_v1, force_instrumental). Eén keer; hergebruikt voor alle video's."""
import json, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
uit = ROOT / "public/muziek/elbe23.mp3"
body = {"model_id": "music_v1", "force_instrumental": True, "music_length_ms": 68000,
        "prompt": "Uplifting, positive, modern corporate instrumental for a premium real estate commercial. Warm light piano, soft plucked guitar, airy pads and gentle percussion, steady mid-tempo around 100 BPM, optimistic and confident, builds subtly and ends with a clean resolved finish. No vocals, no lyrics, leaves space for a voice-over."}
if uit.exists():
    raise SystemExit("bestaat al: niet opnieuw betalen")
r = urllib.request.Request("https://api.elevenlabs.io/v1/music", data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
with urllib.request.urlopen(r, timeout=600) as resp:
    ids = {k: v for k, v in resp.headers.items() if "id" in k.lower()}
    uit.write_bytes(resp.read())
(ROOT / "public/muziek/elbe23.json").write_text(json.dumps({"request": body, "response_headers": ids}, indent=1))
print("klaar", ids)

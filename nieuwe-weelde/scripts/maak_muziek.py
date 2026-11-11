"""Uplifting instrumentale achtergrondmuziek via ElevenLabs Music (music_v1). Eén stem voor alle 15 video's; instellingen + song-id worden bewaard."""
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
uit = ROOT / "public/muziek/nieuwe-weelde-uplifting.mp3"
if uit.exists():
    raise SystemExit("stem bestaat al, niet opnieuw genereren")
body = {
    "model_id": "music_v1",
    "prompt": "Uplifting, warm and positive instrumental background music for a real estate advertisement about comfortable apartments for seniors and families: gentle acoustic guitar, soft piano, light strings and a subtle steady beat, hopeful and welcoming, steady energy without big drops, no vocals.",
    "force_instrumental": True,
    "music_length_ms": 75000,
}
r = urllib.request.Request("https://api.elevenlabs.io/v1/music", data=json.dumps(body).encode(), headers={"Content-Type": "application/json"}, method="POST")
with urllib.request.urlopen(r, timeout=600) as resp:
    audio = resp.read()
    hdr = {k: v for k, v in resp.headers.items() if k.lower() in ("song-id", "request-id", "x-request-id", "content-type")}
uit.write_bytes(audio)
(ROOT / "public/muziek/muziek-instellingen.json").write_text(json.dumps({"request": body, "response_headers": hdr}, indent=1))
print(len(audio), hdr)

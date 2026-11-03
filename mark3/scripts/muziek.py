import json, pathlib
from common import *
ROOT = pathlib.Path(__file__).resolve().parent.parent
b = bridge()
body = {"prompt": "Uplifting, positive, modern corporate instrumental background music for a commercial real estate advert: light driving beat, warm piano and soft synth arpeggios, optimistic and confident, steady energy, no vocals, no lyrics.",
        "music_length_ms": 66000, "model_id": "music_v1", "force_instrumental": True}
raw, h = el("POST", "/v1/music?output_format=mp3_44100_128", body, timeout=600)
(ROOT / "public/muziek/muziek.mp3").write_bytes(raw)
rid = {k.lower(): v for k, v in h.items()}.get("request-id")
(ROOT / "work/music-settings.json").write_text(json.dumps({"request": {k: v for k, v in body.items()}, "request_id": rid, "song_id": {k: v for k, v in h.items() if "song" in k.lower()}}, indent=1))
print("music", len(raw), rid, [k for k in h])
if rid: b.record_elevenlabs("music", "music_v1", rid, headers=h, seconds=66)

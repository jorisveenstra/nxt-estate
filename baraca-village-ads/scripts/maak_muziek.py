"""Eén instrumentale, opbeurende muziekstem via ElevenLabs Music (music_v1); hergebruikt voor alle 15 varianten."""
import json, sys, pathlib, urllib.request
sys.path.insert(0, str(pathlib.Path(__file__).parent)); import portal
ROOT = pathlib.Path(__file__).resolve().parent.parent
MS = 66000
PROMPT = ("Uplifting, warm instrumental background music for a premium tropical villa investment ad: gentle acoustic guitar, soft marimba, "
          "light airy strings and a soft steady pulse, optimistic and calm, island sunrise mood. No vocals, no lyrics.")
body = {"prompt": PROMPT, "music_length_ms": MS, "model_id": "music_v1", "force_instrumental": True}
req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", json.dumps(body).encode(),
    {"xi-api-key": "proxy-injected", "Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=600) as r:
    hdr = {k.lower(): v for k, v in r.headers.items()}; data = r.read()
(ROOT / "public/muziek/achtergrond.mp3").write_bytes(data)
rid = hdr.get("request-id", "")
meta = {"model_id": "music_v1", "prompt": PROMPT, "music_length_ms": MS, "force_instrumental": True, "request_id": rid,
        "song_id": hdr.get("song-id"), "character_cost": hdr.get("character-cost")}
(ROOT / "muziek-meta.json").write_text(json.dumps(meta, indent=1))
print(meta)
if rid:
    portal.record_eleven("music", "music_v1", rid, credits=hdr.get("character-cost"), seconds=MS / 1000)
    print(portal.flush())

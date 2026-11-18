"""Eén instrumentale, opgewekte muziekbed via ElevenLabs Music (music_v1), hergebruikt voor alle 15 video's.
Wordt niet opnieuw betaald als public/muziek/muziek.mp3 + scripts/muziek-provenance.json al bestaan."""
import json, os, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
OUT, PROV = ROOT / "public/muziek/muziek.mp3", ROOT / "scripts/muziek-provenance.json"
PROMPT = ("Uplifting, warm and positive instrumental background music for a premium new-build home advert next to a green city park. "
          "Light acoustic guitar, soft piano, gentle claps and airy strings, steady medium tempo around 105 BPM, optimistic and elegant, "
          "consistent energy without big drops, clean ending. No vocals, no lyrics.")
LENGTH_MS = 66000
if PROV.exists() and OUT.exists():
    raise SystemExit("muziek bestaat al, niets opnieuw betaald")
body = {"model_id": "music_v1", "prompt": PROMPT, "music_length_ms": LENGTH_MS, "force_instrumental": True}
PROV.write_text(json.dumps({"state": "posting", **body}, indent=1))
h = {"Content-Type": "application/json"}
if os.environ.get("ELEVENLABS_API_KEY"):
    h["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192", json.dumps(body).encode(), h)
with urllib.request.urlopen(req, timeout=600) as r:
    rh = {k.lower(): v for k, v in r.headers.items()}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(r.read())
keep = {k: v for k, v in rh.items() if k in ("request-id", "character-cost", "song-id", "x-song-id") or "cost" in k or "song" in k}
PROV.write_text(json.dumps({"state": "done", **body, "headers": keep}, indent=1))
print(keep)

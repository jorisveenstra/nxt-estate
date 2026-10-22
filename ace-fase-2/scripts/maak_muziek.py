"""Eén instrumentale, opgewekte muziekstem via ElevenLabs Music (music_v1), gedeeld door alle video's.
Een bestaand bestand wordt nooit opnieuw gegenereerd (kosten). Instellingen: public/muziek/muziek.json"""
import json, os, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
uit = ROOT / "public/muziek/ace-opgewekt.mp3"
if uit.exists():
    raise SystemExit("bestaat al, niet opnieuw genereren")
body = {"prompt": "Uplifting, positive, modern instrumental background music for a real estate ad in Amsterdam: warm acoustic guitar and soft piano, light percussion, gentle optimistic build, bright and welcoming, steady mid-tempo around 100 bpm, no vocals, no lyrics, mixes quietly under a voice-over",
        "music_length_ms": 70000, "model_id": "music_v1", "force_instrumental": True}
h = {"Content-Type": "application/json"}
if os.environ.get("ELEVENLABS_API_KEY"):
    h["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", data=json.dumps(body).encode(), headers=h)
with urllib.request.urlopen(req, timeout=600) as r:
    uit.write_bytes(r.read())
    song = r.headers.get("song-id")
(ROOT / "public/muziek/muziek.json").write_text(json.dumps({**body, "song_id": song, "bestand": uit.name}, indent=1))
print("klaar", uit.stat().st_size, song)

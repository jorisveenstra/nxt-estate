"""
Achtergrondmuziek via ElevenLabs Music (model music_v1, instrumentaal). Eén stem van 70 s wordt
hergebruikt voor alle 15 varianten (ingekort + fade-out per video). Herkomst in scripts/music-provenance.json.
Authenticatie: netwerksecret (xi-api-key) of ELEVENLABS_API_KEY in ~/.elevenlabs. Geen sleutels opslaan.
"""
import json, os, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROV = ROOT / "scripts/music-provenance.json"
OUT = ROOT / "public/music/muziek.mp3"
PROMPT = ("Uplifting, warm and positive instrumental background music for a tropical villa investment ad: "
          "light acoustic guitar, soft marimba and gentle percussion, airy pads, steady medium tempo around 100 BPM, "
          "optimistic and calm, sunny island feel, unobtrusive under a spoken voice-over, no vocals, no lyrics, "
          "consistent energy with a soft natural ending.")
LENGTH_MS = 70000
on_usage = None


def main():
    if OUT.exists():
        print("muziek bestaat al"); return
    if PROV.exists() and json.loads(PROV.read_text()).get("status") == "pending":
        raise SystemExit("Eerdere muziekrequest met onzekere uitkomst; niet blind herhalen")
    body = {"prompt": PROMPT, "music_length_ms": LENGTH_MS, "model_id": "music_v1", "force_instrumental": True}
    PROV.write_text(json.dumps({"status": "pending", **body}, indent=1))
    h = {"Content-Type": "application/json"}
    req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128",
                                 data=json.dumps(body).encode(), headers=h)
    with urllib.request.urlopen(req, timeout=600) as r:
        audio = r.read(); rh = dict(r.headers.items())
    OUT.write_bytes(audio)
    low = {k.lower(): v for k, v in rh.items()}
    PROV.write_text(json.dumps({"status": "done", **body, "request_id": low.get("request-id"),
                                "song_id": low.get("song-id"), "character_cost": low.get("character-cost")}, indent=1))
    if on_usage and low.get("request-id"):
        on_usage(low["request-id"], rh, LENGTH_MS / 1000)
    print("muziek klaar", len(audio), "bytes")


if __name__ == "__main__":
    main()

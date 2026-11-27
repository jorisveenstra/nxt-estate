"""
Genereert één opgewekte instrumentale muziekbed via ElevenLabs Music (music_v1, force_instrumental) die voor
alle 15 varianten wordt hergebruikt (ingekort + uitgefaded in Remotion). Wordt nooit opnieuw ingediend als
public/music/muziek.mp3 of een eerdere (onzekere) poging in public/music/muziek.json bestaat.
"""
import json
import os
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MP3 = ROOT / "public/music/muziek.mp3"
META = ROOT / "public/music/muziek.json"
PROMPT = ("Uplifting, warm and positive instrumental background music for a real estate advert about comfortable "
          "single-storey bungalows in a friendly Dutch village. Light acoustic guitar, soft piano, gentle percussion, "
          "optimistic and calm, steady tempo around 100 BPM, no vocals, no lyrics, unobtrusive under narration, "
          "with a natural ending.")
LENGTE_MS = 78000


def main():
    if MP3.exists() or META.exists():
        print("muziek bestaat al of eerdere poging vastgelegd; niet opnieuw ingediend")
        return
    body = {"prompt": PROMPT, "music_length_ms": LENGTE_MS, "model_id": "music_v1", "force_instrumental": True}
    META.parent.mkdir(parents=True, exist_ok=True)
    META.write_text(json.dumps({"status": "submitted_uncertain", **body}, indent=1))
    h = {"Content-Type": "application/json"}
    if os.environ.get("ELEVENLABS_API_KEY"):
        h["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
    req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192",
                                 data=json.dumps(body).encode(), headers=h)
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            hdrs = {k.lower(): v for k, v in r.headers.items()}
            MP3.write_bytes(r.read())
    except urllib.error.HTTPError as e:
        META.write_text(json.dumps({"status": "rejected", "http": e.code, "error": e.read(500).decode(errors="replace"), **body}, indent=1))
        raise SystemExit(f"Muziek geweigerd: HTTP {e.code}")
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(MP3)],
                               capture_output=True, text=True).stdout)
    meta = {"status": "completed", **body, "request_id": hdrs.get("request-id"), "song_id": hdrs.get("song-id"),
            "character_cost": hdrs.get("character-cost"), "duur": dur,
            "response_headers": {k: v for k, v in hdrs.items() if k not in ("set-cookie",)}}
    META.write_text(json.dumps(meta, indent=1))
    print(json.dumps({k: meta[k] for k in ("request_id", "song_id", "character_cost", "duur")}))
    hook = os.environ.get("USAGE_HOOK")
    if hook and meta["request_id"]:
        subprocess.run([sys.executable, "-I", hook, "music", "music_v1", meta["request_id"],
                        json.dumps({k: v for k, v in hdrs.items() if k in ("request-id", "character-cost")}),
                        json.dumps({"seconds": dur})], check=False)


if __name__ == "__main__":
    main()

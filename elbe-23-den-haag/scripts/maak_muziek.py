"""
Maakt één opbeurende instrumentale muziekbed via ElevenLabs Music (music_v1), lang genoeg voor de
langste video; per video wordt het bed ingekort met fade-out (scripts/bouw_audio.py). Zo betalen we
niet 15 keer voor identieke muziek. Provenance (request-id, song-id) gaat naar public/muziek/muziek.meta.json.
Een aanvraag met onzekere uitkomst (.pending) wordt niet automatisch herhaald.
"""
import json, os, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public/muziek/muziek.mp3"
META = ROOT / "public/muziek/muziek.meta.json"
PENDING = ROOT / "public/muziek/muziek.pending"
LENGTE_MS = 62000
PROMPT = ("Uplifting, positive and confident instrumental background music for a modern Dutch commercial "
          "real estate advert: warm soft piano, light plucked guitar, airy synth pads and a gentle steady "
          "pulse, optimistic and professional, building slightly, no vocals, no lyrics, clean ending.")

def main():
    if OUT.exists():
        print("bestaat al, hergebruikt"); return
    if PENDING.exists():
        raise SystemExit("Onzekere eerdere muziekaanvraag; niet blind herhalen.")
    body = {"prompt": PROMPT, "music_length_ms": LENGTE_MS, "model_id": "music_v1", "force_instrumental": True}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    PENDING.write_text(json.dumps(body))
    headers = {"Content-Type": "application/json", "User-Agent": "nxt-video-ads/1.0"}
    if os.environ.get("ELEVENLABS_API_KEY"):
        headers["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
    req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128",
                                 data=json.dumps(body).encode(), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            data = r.read()
            hdr = {k.lower(): v for k, v in r.headers.items()
                   if k.lower() in ("request-id", "character-cost", "song-id", "content-type")}
    except urllib.error.HTTPError as e:
        PENDING.unlink()
        raise SystemExit(f"ElevenLabs Music afgewezen ({e.code}): {e.read(500).decode(errors='replace')}")
    OUT.write_bytes(data)
    META.write_text(json.dumps({"model_id": "music_v1", **body, "headers": hdr}, indent=1))
    PENDING.unlink()
    print("klaar", hdr)

if __name__ == "__main__":
    main()

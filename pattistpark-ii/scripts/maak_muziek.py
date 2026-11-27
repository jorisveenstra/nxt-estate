"""
Eén opbeurende instrumentale muziekbed via ElevenLabs Music (model music_v1), hergebruikt voor alle
15 varianten (per video ingekort met fade-out). Wordt nooit opnieuw gegenereerd als het bestand er al is.

Herkomst (instellingen, request-id, song-id, credits) staat in public/muziek/herkomst.json; geen sleutels.
Gebruik: python3 scripts/maak_muziek.py <lengte_ms>
"""
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

from maak_vo import sleutel

ROOT = Path(__file__).resolve().parent.parent
UIT = ROOT / "public/muziek/muziek.mp3"
META = ROOT / "public/muziek/herkomst.json"
PROMPT = ("Uplifting, warm and positive instrumental background music for a premium waterfront apartment ad "
          "aimed at senior home buyers in Zeeland. Gentle felt piano, light acoustic guitar, soft strings and a "
          "subtle steady pulse, around 100 BPM, hopeful and calm, bright but not busy, leaves room for a voice-over. "
          "No vocals, no lyrics, no singing. Smooth consistent energy with a satisfying ending.")


def main():
    if UIT.exists():
        print("Muziek bestaat al; hergebruikt.")
        return
    lengte = int(sys.argv[1])
    inflight = UIT.with_suffix(".inflight")
    if inflight.exists():
        raise SystemExit("Onzekere eerdere muziekaanvraag; niet blind herhalen.")
    UIT.parent.mkdir(parents=True, exist_ok=True)
    body = {"prompt": PROMPT, "model_id": "music_v1", "music_length_ms": lengte, "force_instrumental": True}
    headers = {"Content-Type": "application/json"}
    if sleutel():
        headers["xi-api-key"] = sleutel()
    inflight.write_text("")
    req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192",
                                 data=json.dumps(body).encode(), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            data = r.read()
            hdr = {k.lower(): v for k, v in r.headers.items()}
    except urllib.error.HTTPError as e:
        inflight.unlink()
        raise SystemExit(f"ElevenLabs Music weigerde ({e.code}): {e.read(500).decode(errors='replace')}")
    UIT.write_bytes(data)
    META.write_text(json.dumps({
        "settings": body, "request_id": hdr.get("request-id"), "song_id": hdr.get("song-id"),
        "character_cost": hdr.get("character-cost"),
        "response_headers": {k: v for k, v in hdr.items() if k not in ("set-cookie",)},
    }, indent=1))
    inflight.unlink()
    print("Muziek gegenereerd:", len(data), "bytes; credits", hdr.get("character-cost"))


if __name__ == "__main__":
    main()

"""
Eén opgewekte instrumentale muziekbed via ElevenLabs Music (music_v1), hergebruikt voor alle 15 varianten
(per video ingekort met fade-out). Herkomst (request-id, song-id, kosten) in scripts/muziek-herkomst.json.
Een eerder gestarte maar onafgemaakte generatie (.pending) wordt NIET automatisch herhaald.

Gebruik: python3 scripts/maak_muziek.py <lengte_ms>
"""
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UIT = ROOT / "public/muziek/muziek.mp3"
HERKOMST = ROOT / "scripts/muziek-herkomst.json"
PENDING = ROOT / "scripts/muziek.pending"
PROMPT = ("Uplifting, warm and positive instrumental background music for a residential property advert about "
          "calm living surrounded by greenery. Light acoustic guitar, soft piano, gentle claps and subtle "
          "percussion, bright and optimistic, steady around 100 bpm, consistent energy, no vocals, no lyrics.")


def main():
    lengte = int(sys.argv[1])
    if UIT.exists():
        print("muziek bestaat al, hergebruikt")
        return
    if PENDING.exists():
        raise SystemExit("Onzekere eerdere muziekgeneratie: eerst controleren in ElevenLabs")
    body = {"prompt": PROMPT, "model_id": "music_v1", "music_length_ms": lengte, "force_instrumental": True}
    PENDING.write_text("1")
    req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192",
                                 data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    try:
        r = urllib.request.urlopen(req, timeout=600)
    except urllib.error.HTTPError as err:
        PENDING.unlink()
        raise SystemExit(f"ElevenLabs Music weigerde ({err.code}): {err.read(500)!r}")
    with r:
        data = r.read()
        meta = {k.lower(): v for k, v in r.headers.items()
                if k.lower() in ("request-id", "character-cost", "song-id", "x-song-id", "history-item-id")}
    UIT.parent.mkdir(parents=True, exist_ok=True)
    UIT.write_bytes(data)
    HERKOMST.write_text(json.dumps({"model_id": "music_v1", "music_length_ms": lengte, "prompt": PROMPT,
                                    "force_instrumental": True, **meta}, indent=1))
    PENDING.unlink()
    print("muziek klaar", meta)


if __name__ == "__main__":
    main()

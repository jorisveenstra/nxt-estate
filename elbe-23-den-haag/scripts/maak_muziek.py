"""
Eén instrumentale, opgewekte muziekbed via ElevenLabs Music (music_v1), gedeeld door alle hooks van body 1.
Provenance (request-id, song-id, character-cost, prompt) in scripts/muziek-provenance.json; nooit blind herhalen.
"""
import json, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
PROV = ROOT / "scripts/muziek-provenance.json"
OUT = ROOT / "public/muziek/b1-bed.mp3"
PROMPT = ("Uplifting, positive, modern instrumental corporate background track for a real estate ad about "
          "new business units with workshops for garages: confident driving pulse, warm electric piano, "
          "light plucked guitar, soft synth pads, tight modern drums at a steady 110 BPM, optimistic and "
          "professional, consistent energy throughout, clean ending. No vocals, no lyrics, no singing.")
LEN = 65000

def main():
    if OUT.exists():
        print("bestaat al"); return
    prov = json.loads(PROV.read_text()) if PROV.exists() else {}
    if prov and not prov.get("done"):
        raise SystemExit("eerdere muziekaanvraag met onzekere uitkomst; niet blind herhalen")
    body = {"prompt": PROMPT, "music_length_ms": LEN, "model_id": "music_v1", "force_instrumental": True}
    PROV.write_text(json.dumps({"request": body, "done": False}, indent=1))
    req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192",
                                 data=json.dumps(body).encode(), headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=600) as r:
        data = r.read()
        rh = {k.lower(): v for k, v in r.headers.items()}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(data)
    keep = {k: v for k, v in rh.items() if k in ("request-id", "character-cost", "song-id", "x-song-id", "history-item-id")}
    PROV.write_text(json.dumps({"request": body, "done": True, "headers": keep}, indent=1))
    print(keep, len(data))

if __name__ == "__main__":
    main()

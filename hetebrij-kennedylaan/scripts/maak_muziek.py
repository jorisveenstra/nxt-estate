"""
Eén instrumentale, positieve muziekbed via ElevenLabs Music (model_id music_v1), hergebruikt in alle varianten.
Uitkomst: public/muziek/bed.mp3 + scripts/muziek-meta.json (instellingen, request-/song-id, kosten).
Een aanvraag die is gestart maar geen resultaat heeft (marker) wordt niet blind herhaald.
"""
import json, os, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
META = ROOT / "scripts/muziek-meta.json"
OUT = ROOT / "public/muziek/bed.mp3"
BODY = {
    "model_id": "music_v1",
    "prompt": ("Uplifting, warm and positive instrumental background music for a Dutch new-build housing advert: "
               "light acoustic guitar, soft piano, gentle claps and a steady modern pop groove around 105 BPM, "
               "hopeful and homely, calm enough to sit underneath a voice-over, no vocals, no lyrics, clean ending."),
    "music_length_ms": 56000,
    "force_instrumental": True,
}


def main():
    if OUT.exists():
        print("al aanwezig"); return
    m = json.loads(META.read_text()) if META.exists() else {}
    if m.get("started"):
        raise SystemExit("Onzekere eerdere muziekaanvraag; niet blind herhalen")
    META.write_text(json.dumps({"started": True, "request": BODY}, indent=1))
    h = {"Content-Type": "application/json", "User-Agent": "video-ads/1.0"}
    if os.environ.get("ELEVENLABS_API_KEY"):
        h["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
    req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192",
                                 data=json.dumps(BODY).encode(), headers=h, method="POST")
    with urllib.request.urlopen(req, timeout=600) as r:
        hd = {k.lower(): v for k, v in r.headers.items()}
        data = r.read()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(data)
    rid = hd.get("request-id")
    META.write_text(json.dumps({"started": True, "request": BODY, "request_id": rid, "song_id": hd.get("song-id"),
                                "character_cost": hd.get("character-cost"), "response_header_names": sorted(hd)}, indent=1))
    print("muziek klaar", len(data), "bytes, request", rid, "cost", hd.get("character-cost"))
    if os.environ.get("NXT_BRIDGE_DIR") and rid:
        sys.path.insert(0, os.environ["NXT_BRIDGE_DIR"])
        import b
        print(b.bridge().record_elevenlabs("music", "music_v1", rid, headers=hd, seconds=BODY["music_length_ms"] / 1000))


if __name__ == "__main__":
    main()

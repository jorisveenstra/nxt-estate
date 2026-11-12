"""
Achtergrondmuziek via ElevenLabs Music (model music_v1, instrumentaal). Eén bed per body, lang genoeg
voor de langste hook-variant; per video wordt het bed ingekort en onder de voice-over gemixt (ducking).
Provenance (prompt, lengte, request-id/song-id) in public/music/provenance.json. Nooit opnieuw genereren
als het bestand of een .pending-marker al bestaat.
"""
import json, os, sys, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public/music"
PROMPT = ("Uplifting, positive and modern instrumental background music for a Dutch commercial real estate "
          "advertisement: confident light electronic pop with warm plucked synths, soft piano, gentle claps and a "
          "steady mid-tempo groove around 105 BPM. Optimistic and ambitious, clean production, no vocals, no lyrics, "
          "even energy without big drops so a voice-over stays clearly on top, with a natural ending.")
usage_cb = None


def music(naam, seconds):
    pad, marker = OUT / f"{naam}.mp3", OUT / f"{naam}.pending"
    if pad.exists():
        return
    if marker.exists():
        raise SystemExit(f"{naam}: onzekere eerdere aanvraag, niet blind herhalen")
    marker.write_text("1")
    body = {"prompt": PROMPT, "music_length_ms": int(seconds * 1000), "model_id": "music_v1", "force_instrumental": True}
    headers = {"Content-Type": "application/json", "User-Agent": "video-ads/1.0"}
    if os.environ.get("ELEVENLABS_API_KEY"):
        headers["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
    req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128",
                                 data=json.dumps(body).encode(), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            audio, hdrs = r.read(), {k.lower(): v for k, v in r.headers.items()}
    except urllib.error.HTTPError as e:
        marker.unlink()
        raise SystemExit(f"{naam}: ElevenLabs Music {e.code}: {e.read(500).decode(errors='replace')}")
    pad.write_bytes(audio)
    prov = {"model_id": "music_v1", "prompt": PROMPT, "music_length_ms": body["music_length_ms"],
            "force_instrumental": True, "request_id": hdrs.get("request-id"), "song_id": hdrs.get("song-id"),
            "character_cost": hdrs.get("character-cost")}
    (OUT / f"{naam}.json").write_text(json.dumps(prov, indent=1))
    marker.unlink()
    if usage_cb and hdrs.get("request-id"):
        usage_cb(hdrs["request-id"], hdrs, seconds)
    print(naam, "klaar", len(audio), "bytes, cost", hdrs.get("character-cost"), flush=True)


def main(lengtes):
    OUT.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(3) as ex:
        list(ex.map(lambda kv: music(*kv), lengtes.items()))


if __name__ == "__main__":
    main(json.loads(sys.argv[1]))

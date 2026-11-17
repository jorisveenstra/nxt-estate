"""
Eén opgewekte instrumentale muziekbed via ElevenLabs Music (music_v1), hergebruikt voor alle 15 varianten
(iedere video gebruikt het begin van dezelfde stem, ingekort met een korte fade-out).
Uitvoer: public/muziek/muziek.mp3 + public/muziek/muziek.json (instellingen en IDs, zonder credentials).

Gebruik: python3 scripts/maak_muziek.py [lengte_ms]
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import el  # noqa

ROOT = el.ROOT
PROMPT = ("Uplifting, warm and positive instrumental background music for a Dutch real estate advert about a new family "
          "home by the water in a quiet village: light acoustic guitar, soft piano, gentle strings and subtle percussion, "
          "airy and optimistic, steady medium tempo around 100 BPM, no vocals, no lyrics, consistent energy, "
          "mixed to sit underneath a spoken voice-over.")


def main():
    lengte = int(sys.argv[1]) if len(sys.argv) > 1 else 72000
    uit = ROOT / "public/muziek/muziek.mp3"
    meta = ROOT / "public/muziek/muziek.json"
    if uit.exists():
        print("bestaat al:", uit)
        return
    key = "music:muziek"
    e = el.get_entry(key) or {}
    if e.get("status") == "submitting":
        raise SystemExit("eerdere muziekaanvraag met onzekere uitkomst; niet blind herhalen")
    body = {"model_id": "music_v1", "prompt": PROMPT, "music_length_ms": lengte, "force_instrumental": True}
    el.set_entry(key, status="submitting", at=el.now(), **body)
    st, hdrs, data = el.request("POST", "/v1/music?output_format=mp3_44100_192", body=body, timeout=600)
    if st >= 300:
        el.set_entry(key, status="rejected", http=st, error=data[:400].decode(errors="replace"))
        raise SystemExit(f"Music {st}: {data[:400]!r}")
    lh = {k.lower(): v for k, v in hdrs.items()}
    uit.parent.mkdir(parents=True, exist_ok=True)
    uit.write_bytes(data)
    info = {**body, "request_id": lh.get("request-id"), "song_id": lh.get("song-id"),
            "character_cost": lh.get("character-cost"), "headers_seen": sorted(lh.keys())}
    meta.write_text(json.dumps(info, indent=1))
    el.set_entry(key, status="done", request_id=lh.get("request-id"), song_id=lh.get("song-id"), file="public/muziek/muziek.mp3")
    el.record("music", "music_v1", lh.get("request-id") or lh.get("song-id"), hdrs if lh.get("request-id") else {}, seconds=lengte / 1000)
    print("klaar", len(data), "bytes", info["request_id"], info["character_cost"])


if __name__ == "__main__":
    main()

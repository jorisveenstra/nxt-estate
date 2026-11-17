"""
Muziek (ElevenLabs Music, music_v1, instrumentaal) en subtiele geluidseffecten (ElevenLabs Sound Effects).
Eén muziekstem per body, lang genoeg voor de langste hook-variant; kortere varianten worden ingekort
met een korte fade-out. Bestaande stems worden hergebruikt (nooit blind opnieuw betalen).

Gebruik: python3 scripts/maak_audio.py
"""
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from el import ROOT, bon, request  # noqa: E402

MUZIEK_PROMPT = ("Uplifting, positive instrumental background music inspired by Lombok and Bali: warm gamelan "
                 "and metallophone motifs, soft hand percussion, light acoustic guitar and airy pads, gentle "
                 "tropical island feel, optimistic and calm, steady medium tempo, suited as a quiet bed under a "
                 "Dutch voice-over for a real-estate ad. No vocals, no lyrics, no spoken words.")
# lengte in ms per body (langste hook + pauze + body/CTA + staart), zie src/lengtes.json
SFX = {
    "accent-whoosh": ("Very soft, short airy whoosh for a text label sliding in, subtle and clean, no impact", 0.8),
    "accent-pop": ("Soft gentle wooden marimba pop, a single short pleasant UI accent tone", 0.6),
    "golven": ("Gentle tropical ocean waves washing on a sandy beach, calm, distant, ambient", 4.0),
    "tropisch": ("Soft tropical morning ambience with distant birds and light breeze through palm leaves", 4.0),
    "water": ("Small fountain water bubbling and splashing softly in a garden, calm", 3.0),
}


def muziek(b, ms):
    uit = ROOT / f"public/muziek/{b}.mp3"
    if uit.exists():
        return
    lock = uit.with_suffix(".pending")
    if lock.exists():
        raise SystemExit(f"muziek {b}: eerdere aanvraag onzeker; niet blind herhalen")
    lock.write_text("x")
    body = {"model_id": "music_v1", "prompt": MUZIEK_PROMPT, "music_length_ms": ms, "force_instrumental": True}
    status, h, raw = request("POST", "/v1/music?output_format=mp3_44100_192", body)
    bon(f"muziek-{b}", "music", "music_v1", h, status=status, seconds=ms / 1000)
    if status != 200:
        raise SystemExit(f"muziek {b}: fout {status}: {raw[:300]!r}")
    uit.write_bytes(raw)
    (ROOT / f"public/muziek/{b}.json").write_text(json.dumps({
        "model_id": "music_v1", "prompt": MUZIEK_PROMPT, "music_length_ms": ms, "force_instrumental": True,
        "request_id": h.get("request-id"), "song_id": h.get("song-id")}, indent=1))
    lock.unlink()
    print("muziek", b, "klaar", flush=True)


def sfx(naam):
    tekst, sec = SFX[naam]
    uit = ROOT / f"public/sfx/{naam}.mp3"
    if uit.exists():
        return
    lock = uit.with_suffix(".pending")
    if lock.exists():
        raise SystemExit(f"sfx {naam}: eerdere aanvraag onzeker; niet blind herhalen")
    lock.write_text("x")
    body = {"text": tekst, "duration_seconds": sec, "prompt_influence": 0.5, "model_id": "eleven_text_to_sound_v2"}
    status, h, raw = request("POST", "/v1/sound-generation?output_format=mp3_44100_128", body)
    bon(f"sfx-{naam}", "sound_effects", "eleven_text_to_sound_v2", h, status=status, seconds=sec)
    if status != 200:
        raise SystemExit(f"sfx {naam}: fout {status}: {raw[:300]!r}")
    uit.write_bytes(raw)
    (ROOT / f"public/sfx/{naam}.json").write_text(json.dumps({**body, "request_id": h.get("request-id")}, indent=1))
    lock.unlink()
    print("sfx", naam, "klaar", flush=True)


def main():
    (ROOT / "public/muziek").mkdir(parents=True, exist_ok=True)
    (ROOT / "public/sfx").mkdir(parents=True, exist_ok=True)
    lengtes = {"b1": 50000, "b2": 64000, "b3": 61000}
    with ThreadPoolExecutor(4) as pool:
        fs = [pool.submit(muziek, b, ms) for b, ms in lengtes.items()] + [pool.submit(sfx, n) for n in SFX]
        for f in fs:
            f.result()


if __name__ == "__main__":
    main()

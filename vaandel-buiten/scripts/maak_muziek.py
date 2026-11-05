"""Genereert één instrumentale, opbeurende muziekstem via ElevenLabs Music (music_v1, force_instrumental). Eén keer; hergebruikt voor alle varianten."""
import json, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
PAD = ROOT / "public/muziek/muziek.mp3"
META = ROOT / "source-assets/music-meta.json"
BODY = {
    "model_id": "music_v1",
    "prompt": "Uplifting, warm and optimistic instrumental background music for a residential real estate advertisement in the Netherlands: gentle acoustic guitar and soft piano, light percussion, airy strings, "
              "positive and hopeful mood, steady medium tempo around 100 bpm, clean and modern, no vocals, no lyrics, leaves room for a spoken voice-over.",
    "force_instrumental": True,
    "music_length_ms": 72000,
}
if PAD.exists():
    raise SystemExit("muziek bestaat al, niet opnieuw genereren")
META.write_text(json.dumps({"status": "submitting", "request": BODY}, indent=1))
r = subprocess.run(["curl", "-sS", "-D", str(ROOT / "scripts/_h.txt"), "-X", "POST", "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", "-H", "Content-Type: application/json", "-d", json.dumps(BODY), "-o", str(PAD)], capture_output=True, text=True)
head = (ROOT / "scripts/_h.txt").read_text().replace("\r", "")
(ROOT / "scripts/_h.txt").unlink()
h = {}
for line in head.splitlines():
    if ":" in line:
        k, v = line.split(":", 1); h[k.strip().lower()] = v.strip()
keep = {k: v for k, v in h.items() if k in ("request-id", "character-cost", "song-id", "content-type", "content-length")}
META.write_text(json.dumps({"status": "completed" if PAD.stat().st_size > 10000 else "failed", "request": BODY, "headers": keep}, indent=1))
print(keep, PAD.stat().st_size)

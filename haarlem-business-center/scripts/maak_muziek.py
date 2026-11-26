"""
Achtergrondmuziek per body via ElevenLabs Music (model_id="music_v1", instrumentaal), lengte = langste
hook + body + uitloop. Elke aanvraag wordt eerst als 'requesting' vastgelegd in public/muziek/<naam>.meta.json;
een onzekere aanvraag wordt nooit blind herhaald. Authenticatie: netwerkgeheim (cloud) of ELEVENLABS_API_KEY.
Gebruik: python3 scripts/maak_muziek.py
"""
import json, os, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROMPT = ("Uplifting, positive and modern instrumental background music for a premium real-estate advert about "
          "bright new office units on the river in Haarlem. Warm piano, soft plucked guitar, light airy synth pads, "
          "gentle claps and a steady mid-tempo groove around 105 BPM. Optimistic, confident and professional, "
          "understated so a voice-over stays clearly on top. No vocals, no lyrics, no sudden drops.")


def main():
    t = json.loads((ROOT / "src/timing.json").read_text())
    out = ROOT / "public/muziek"; out.mkdir(parents=True, exist_ok=True)
    for b, v in t.items():
        ms = int((max(x["dur"] for x in v["hooks"].values()) + v["body"]["end"] + 3.0) * 1000)
        mp3, meta = out / f"{b}.mp3", out / f"{b}.meta.json"
        if mp3.exists():
            continue
        if meta.exists():
            raise SystemExit(f"Onzekere eerdere muziekaanvraag voor {b}: niet blind herhalen")
        body = {"prompt": PROMPT, "music_length_ms": ms, "model_id": "music_v1", "force_instrumental": True}
        meta.write_text(json.dumps({"state": "requesting", "request": body}))
        cmd = ["curl", "-sS", "-D", str(mp3) + ".hdr", "-o", str(mp3) + ".part", "-w", "%{http_code}", "-X", "POST",
               "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192", "-H", "Content-Type: application/json",
               "--data-binary", json.dumps(body), "--max-time", "600"]
        if os.environ.get("ELEVENLABS_API_KEY"):
            cmd += ["-H", "xi-api-key: " + os.environ["ELEVENLABS_API_KEY"]]
        r = subprocess.run(cmd, capture_output=True, text=True)
        hdr = {}
        for line in Path(str(mp3) + ".hdr").read_text(errors="ignore").splitlines():
            if ":" in line:
                k, val = line.split(":", 1); hdr[k.strip().lower()] = val.strip()
        keep = {k: v for k, v in hdr.items() if k in ("request-id", "song-id", "character-cost", "content-type", "x-song-id")}
        meta.write_text(json.dumps({"state": "done" if r.stdout == "200" else "error", "http": r.stdout, "request": body,
                                    "model_id": "music_v1", "request_id": hdr.get("request-id"), "headers": keep}, indent=1))
        if r.stdout != "200":
            raise SystemExit(f"Muziek {b} mislukt: {r.stdout} {Path(str(mp3) + '.part').read_bytes()[:300]!r}")
        Path(str(mp3) + ".part").rename(mp3)
        print(b, ms, "ms", keep)


if __name__ == "__main__":
    main()

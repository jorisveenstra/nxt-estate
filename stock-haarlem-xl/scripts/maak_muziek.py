"""Instrumentale achtergrondmuziek (ElevenLabs Music, music_v1), één stem per body, hergebruikt voor alle hooks."""
import hashlib, json, math, subprocess
from concurrent.futures import ThreadPoolExecutor
from el import Ledger, paid, report, ROOT

MODEL = "music_v1"
PAUZE, STAART = 0.35, 2.5
PROMPT = {
    "1": "Uplifting, positive modern instrumental for a real estate ad aimed at architects: warm piano, soft plucked guitar, light electronic beat, airy and optimistic, steady 100 bpm, no vocals, clean ending.",
    "2": "Uplifting, energetic yet polished instrumental for a creative agency workspace ad: bright synths, light claps, warm bass, positive and inspiring, 105 bpm, no vocals, clean ending.",
    "3": "Uplifting, elegant instrumental for an interior design studio and showroom ad: soft piano, gentle strings, light percussion, warm and refined, 95 bpm, no vocals, clean ending.",
}


def duur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                                capture_output=True, text=True).stdout)


def maak(b):
    led = Ledger()
    uit = ROOT / f"public/music/body{b}.mp3"
    hook = max(duur(ROOT / f"public/vo/b{b}h{h}.mp3") for h in range(1, 6))
    ms = int(math.ceil((hook + PAUZE + duur(ROOT / f"public/vo/body{b}.mp3") + STAART + 1) * 1000))
    req = {"prompt": PROMPT[b], "music_length_ms": ms, "model_id": MODEL, "force_instrumental": True}
    key = f"music:body{b}:" + hashlib.sha1(json.dumps(req, sort_keys=True).encode()).hexdigest()[:16]
    if uit.exists() and (led.get(key) or {}).get("status") == "done":
        return
    content, hdr = paid(led, key, "POST", "/v1/music?output_format=mp3_44100_192", body=req, meta={"model_id": MODEL, **req})
    uit.write_bytes(content)
    rid = hdr.get("request-id")
    led.update(key, lambda v: {**v, "status": "done", "request_id": rid, "song_id": hdr.get("song-id"),
                                "character_cost": hdr.get("character-cost"), "header_names": sorted(hdr),
                                "sha256": hashlib.sha256(content).hexdigest()})
    report("music", MODEL, rid, hdr, seconds=ms / 1000)
    print(b, ms, "ok", duur(uit))


if __name__ == "__main__":
    with ThreadPoolExecutor(1) as ex:
        list(ex.map(maak, ["1", "2", "3"]))

"""
Animeert de staande startbeelden (bronnen/portret/<naam>-9x16.jpg) tot echte bewegende beelden via
ElevenLabs Image & Video (Veo 3.1, image-to-video, 9:16, 1080p, 8 s, zonder geluid).

- Elke generatie wordt vóór het pollen vastgelegd in bronnen/ai-clips/generaties.json (met lock).
  Een naam met een bestaande generatie-ID wordt NOOIT opnieuw ingediend (geen blinde herhaling).
- Authenticatie: de xi-api-key wordt door de cloudomgeving geïnjecteerd (netwerk-secret) of komt uit
  ~/.elevenlabs. Er staat nooit een sleutel in deze repo.
- Uitvoer: bronnen/ai-clips/<naam>.mp4 (origineel van de provider) en public/clips/<naam>.mp4 (30 fps).

Gebruik: python3 scripts/genereer_clips.py [naam ...]
Optioneel: USAGE_HOOK=<module.pad> om provider-gebruik (request-id/character-cost) te rapporteren.
"""
import fcntl
import json
import os
import subprocess
import sys
import time
import urllib.request
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "bronnen/ai-clips/generaties.json"
MODEL = "veo-3.1-generate-001"
VAST = "one continuous shot, no cuts, no transitions, no morphing. "
BEHOUD = ("Keep the architecture, building proportions, materials, windows, furniture and layout exactly as in the "
          "start image; photorealistic, natural light, no text, no added objects. ")

PROMPTS = {
    "src01": "Very slow gentle push-in through a bright living room towards the large garden window; the man in the armchair calmly reads, curtains move slightly.",
    "src02": "Slow subtle dolly towards the dining table as the woman calmly sets the table, daylight through the large garden windows, plants move softly.",
    "src03": "Slow lateral gimbal glide through a warm living room with garden view, soft afternoon sunlight, curtains sway gently.",
    "src05": "Slow gentle push-in in a bright utility room and storage with washing machine and bicycles near the outside door, calm daylight.",
    "src06": "Slow gentle push-in towards the round green sofa where the dog rests, the pendant lamp hangs still, garden visible outside, warm light.",
    "src07": "Slow smooth dolly along the wooden dining table towards the kitchen, flowers on the table, warm natural light.",
    "src08": "Slow gentle push-in in a calm bedroom towards the open glass doors to the garden, curtains move softly in a light breeze.",
    "src09": "Slow subtle dolly towards the woman relaxing on the sofa with a cat, warm cosy living room, soft daylight.",
    "src10": "Very slow tilt-down and push-in in a light bathroom with terrazzo floor, double vanity and walk-in shower, soft warm light.",
    "src11": "Slow gentle push-in in a warm bedroom with garden doors, soft morning light, plant leaves move slightly.",
    "src12": "Slow lateral gimbal glide through a warm living room with sofa and white coffee table, soft daylight.",
    "src13": "Slow gentle push-in through the living room towards the garden doors where people sit on the terrace, warm daylight.",
    "src14": "Slow gentle drone-like rise over the water and green bank in front of brick bungalows, ducks drift on the water, people relax on the lawn, golden evening light.",
    "src15": "Slow smooth lateral glide along the water in front of brick bungalows with gardens, reeds sway, a small wooden boat on the water, warm evening light.",
    "src16": "Slow gentle push-in on a brick corner bungalow along a quiet green street, two neighbours talk, soft clouds drift in a blue sky.",
    "src17": "Slow gentle crane-up on a quiet residential courtyard with brick bungalows, a child kicks a ball on the grass, calm blue sky.",
    "src18": "Slow gentle push-in on a sunny private garden terrace of a brick bungalow where a couple relaxes, blossoms move softly in the breeze.",
    "src19": "Slow gentle push-in on a sunny garden with pergola and climbing roses at a brick bungalow, people relax under the pergola, leaves move softly.",
    "src20": "Slow gentle push-in in a calm warm bedroom with soft lamp light and golden pendant, very subtle movement.",
}


def headers(extra=None):
    h = {"Accept": "application/json"}
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key and (Path.home() / ".elevenlabs").exists():
        for r in (Path.home() / ".elevenlabs").read_text().splitlines():
            if r.startswith("ELEVENLABS_API_KEY="):
                key = r.split("=", 1)[1].strip()
    if key:
        h["xi-api-key"] = key  # anders injecteert de cloud-proxy de sleutel
    h.update(extra or {})
    return h


def ledger_update(naam, **velden):
    LEDGER.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(LEDGER, os.O_CREAT | os.O_RDWR, 0o644)
    with os.fdopen(fd, "r+") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        raw = f.read()
        data = json.loads(raw) if raw else {}
        data.setdefault(naam, {}).update(velden)
        f.seek(0); f.truncate(); json.dump(data, f, indent=1); f.flush(); os.fsync(f.fileno())
        return data[naam]


def ledger():
    return json.loads(LEDGER.read_text()) if LEDGER.exists() else {}


def upload_asset(pad):
    grens = uuid.uuid4().hex
    body = (f"--{grens}\r\nContent-Disposition: form-data; name=\"name\"\r\n\r\n{pad.stem}\r\n"
            f"--{grens}\r\nContent-Disposition: form-data; name=\"asset\"; filename=\"{pad.name}\"\r\n"
            f"Content-Type: image/jpeg\r\n\r\n").encode() + pad.read_bytes() + f"\r\n--{grens}--\r\n".encode()
    req = urllib.request.Request("https://api.elevenlabs.io/v1/assets", data=body, method="POST",
                                 headers=headers({"Content-Type": f"multipart/form-data; boundary={grens}"}))
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())


def report(naam, rid, hdrs):
    hook = os.environ.get("USAGE_HOOK")
    if hook:
        subprocess.run([sys.executable, "-I", hook, "video", MODEL, rid, json.dumps(hdrs)], check=False)


def maak(naam):
    import hashlib
    start = ROOT / "bronnen/portret" / f"{naam}-9x16.jpg"
    origineel = ROOT / "bronnen/ai-clips" / f"{naam}.mp4"
    rec = ledger().get(naam, {})
    if not origineel.exists():
        if not rec.get("generation_id"):
            if rec.get("submitted_uncertain"):
                print(naam, "ONZEKERE eerdere indiening, niet opnieuw ingediend", flush=True)
                return
            if not rec.get("asset_id"):
                a = upload_asset(start)
                rec = ledger_update(naam, asset_id=a.get("asset_id") or a.get("id"),
                                    start_sha256=hashlib.sha256(start.read_bytes()).hexdigest())
            prompt = VAST + BEHOUD + PROMPTS[naam] + " " + VAST
            body = {"model_id": MODEL, "prompt": prompt, "start_frame": {"type": "asset", "asset_id": rec["asset_id"]},
                    "resolution": "1080p", "duration_secs": 8, "generate_audio": False, "aspect_ratio": "9:16"}
            ledger_update(naam, submitted_uncertain=True, prompt=prompt, model_id=MODEL)
            req = urllib.request.Request("https://api.elevenlabs.io/v1/flows/video", data=json.dumps(body).encode(),
                                         method="POST", headers=headers({"Content-Type": "application/json"}))
            try:
                with urllib.request.urlopen(req, timeout=180) as r:
                    hdrs = dict(r.headers.items())
                    gen = json.loads(r.read())
            except urllib.error.HTTPError as e:
                # Duidelijke weigering (4xx): niets gefactureerd; vastleggen en stoppen.
                ledger_update(naam, submitted_uncertain=False, error=f"HTTP {e.code}: {e.read(500).decode(errors='replace')}")
                print(naam, "GEWEIGERD", e.code, flush=True)
                return
            rid = hdrs.get("request-id") or hdrs.get("Request-Id") or ""
            rec = ledger_update(naam, generation_id=gen["id"], request_id=rid, submitted_uncertain=False,
                                character_cost=hdrs.get("character-cost"), response_headers=hdrs)
            print(naam, "ingediend", gen["id"], flush=True)
            # Zonder request-id rapporteren we de generatie-ID als provider-operatie-ID (credits blijven dan onbekend).
            report(naam, rid or gen["id"], {k: v for k, v in hdrs.items() if k.lower() == "character-cost"})
        gid = rec["generation_id"]
        wacht = 20
        for _ in range(120):
            time.sleep(wacht)
            req = urllib.request.Request(f"https://api.elevenlabs.io/v1/flows/video/{gid}", headers=headers())
            try:
                with urllib.request.urlopen(req, timeout=60) as r:
                    st = json.loads(r.read())
            except Exception as e:  # tijdelijke netwerkfout bij pollen: gewoon opnieuw pollen
                print(naam, "poll-fout", e, flush=True)
                continue
            if st.get("status") in ("completed", "failed"):
                break
            wacht = min(45, wacht * 1.2)
        ledger_update(naam, status=st.get("status"), result={k: v for k, v in st.items() if k not in ("content_url",)})
        if st.get("status") != "completed":
            print(naam, "MISLUKT", st.get("failure_reason"), st.get("error_message"), flush=True)
            return
        # Download zonder provider- of portalcredentials naar de content-host te sturen.
        subprocess.run(["curl", "-sS", "-f", "-o", str(origineel), st["content_url"]], check=True)
    ledger_update(naam, clip_sha256=hashlib.sha256(origineel.read_bytes()).hexdigest())
    print(naam, "klaar", flush=True)


def main():
    namen = sys.argv[1:] or list(PROMPTS)
    with ThreadPoolExecutor(5) as pool:
        for n, f in [(n, pool.submit(maak, n)) for n in namen]:
            try:
                f.result()
            except Exception as e:
                print(n, "FOUT", repr(e)[:300], flush=True)


if __name__ == "__main__":
    main()

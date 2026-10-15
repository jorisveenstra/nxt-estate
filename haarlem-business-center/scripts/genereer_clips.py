"""
Animeert de bronbeelden (renders) tot echte bewegende clips via ElevenLabs Image & Video
(veo-3.1-generate-001, 1080p, 9:16, zonder geluid). Elke aanvraag wordt direct in ai-renders/ledger.json
vastgelegd (SHA256 van de bron + generation_id), zodat een onzekere uitkomst nooit blind opnieuw wordt betaald.

Gebruik: python3 scripts/genereer_clips.py [naam ...]
Authenticatie: de omgeving injecteert xi-api-key voor api.elevenlabs.io (geen sleutel in de repo).
"""
import hashlib, json, subprocess, sys, threading, time, urllib.request, uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "ai-renders/ledger.json"
LOCK = threading.Lock()
BASE = "https://api.elevenlabs.io/v1"

STIJL = ("Photorealistic architectural visualisation brought to life. Preserve the buildings, proportions, materials, "
         "brick facade, glazing and layout of the image exactly. Subtle realistic camera movement, natural light, "
         "small natural movement of people, water and trees. No text changes, no morphing, no new structures. ")
BEWEGING = {
    "g33": "Slow gentle push-in on the rooftop terrace, people chatting on the lounge sofas, light breeze moving the plants, river in the background.",
    "h26-1": "Slow forward glide into the covered courtyard, cars slowly driving, people walking by the entrance.",
    "h26-10": "Slow push-in towards the building, a man walks across the car park, cars move slightly.",
    "h26-2": "Slow sideways dolly past the covered passage with parked bicycles, a person walks, soft sunlight shifting.",
    "h7": "Slow forward glide through the covered street between the units, a car drives down the ramp, soft light.",
    "hbc-entree-close-up": "Slow push-in to the glass entrance, people walk near the entrance, a van is parked, subtle light.",
    "hbc-punt-orgineel": "Slow drone-like move along the waterfront towards the building, water rippling, a small boat floats, grass moves in the wind.",
    "hbc-spaarne-kant-4": "Slow lateral drone move along the canal, water rippling, swans drift, a small boat moves.",
    "hbc-waarderweg": "Slow lateral move along the road in front of the building, cars pass, tree moves in the breeze.",
    "j19": "Slow push-in through the lunchroom with large windows, people eating and talking, light breeze outside on the terrace.",
    "j38-3": "Very slow upward tilt along the brick facade, lights glow softly in the windows.",
    "j38": "Very slow lateral move along the brick facade with large industrial windows, subtle light changes.",
    "onder-het-dek": "Slow forward glide down the long covered street, a car slowly arrives, soft daylight.",
    "punt-closeup": "Slow push-in on the building corner by the water, boat and water gently moving, the logo stays unchanged.",
    "units-met-glazen-gevel-gecombineerd": "Slow forward push-in on the unit facades, people walk past, a motorcycle and a car on the forecourt.",
    "units-standaard-met-glazen-overhead-deur": "Slow push-in on the unit with the glass overhead door, a white car drives slowly past, bikes in front.",
}


def api(method, path, body=None, raw=None, ctype="application/json"):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    req = urllib.request.Request(BASE + path, data=data, method=method, headers={"Content-Type": ctype} if data else {})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.loads(r.read())


def ledger():
    return json.loads(LEDGER.read_text()) if LEDGER.exists() else {}


def schrijf(naam, **kw):
    with LOCK:
        l = ledger(); l.setdefault(naam, {}).update(kw)
        LEDGER.write_text(json.dumps(l, indent=1))


def upload_asset(naam, pad):
    b = uuid.uuid4().hex
    inhoud = Path(pad).read_bytes()
    body = (f"--{b}\r\nContent-Disposition: form-data; name=\"name\"\r\n\r\n{naam}\r\n"
            f"--{b}\r\nContent-Disposition: form-data; name=\"asset\"; filename=\"{naam}.png\"\r\nContent-Type: image/png\r\n\r\n").encode() \
           + inhoud + f"\r\n--{b}--\r\n".encode()
    return api("POST", "/assets", raw=body, ctype=f"multipart/form-data; boundary={b}")


def dien_in(naam):
    bron = ROOT / "public/bron" / f"{naam}.png"
    sha = hashlib.sha256(bron.read_bytes()).hexdigest()
    e = ledger().get(naam, {})
    if e.get("generation_id"):
        return e["generation_id"]
    if e.get("status") == "uncertain":
        raise SystemExit(f"{naam}: onzekere uitkomst, handmatig controleren")
    schrijf(naam, sha256=sha, status="uploading")
    a = upload_asset(f"hbc-{naam}", bron)
    asset_id = a.get("id") or a.get("asset_id")
    schrijf(naam, asset_id=asset_id, status="submitting")
    try:
        g = api("POST", "/flows/video", {
            "model_id": "veo-3.1-generate-001", "prompt": STIJL + BEWEGING[naam],
            "start_frame": {"type": "asset", "asset_id": asset_id},
            "resolution": "1080p", "duration_secs": 8, "generate_audio": False, "aspect_ratio": "9:16"})
    except Exception as ex:
        schrijf(naam, status="uncertain", fout=str(ex)[:200]); raise
    schrijf(naam, generation_id=g["id"], status="submitted")
    print(naam, "ingediend", flush=True)
    return g["id"]


def wacht_en_haal(naam, gid):
    out = ROOT / "ai-renders" / f"{naam}.mp4"
    if not out.exists():
        wacht = 20
        for _ in range(120):
            time.sleep(wacht)
            r = api("GET", f"/flows/video/{gid}")
            if r["status"] in ("completed", "failed"):
                break
            wacht = min(45, wacht * 1.2)
        if r["status"] != "completed":
            schrijf(naam, status="failed", fout=str(r.get("failure_reason") or r.get("error_message"))[:200])
            print(naam, "MISLUKT", r.get("failure_reason"), flush=True); return
        out.write_bytes(urllib.request.urlopen(r["content_url"], timeout=300).read())  # geen credentials naar content-host
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(out), "-vf",
                    "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p", "-an",
                    "-c:v", "libx264", "-crf", "19", "-preset", "medium", "-movflags", "+faststart",
                    str(ROOT / "public/clips" / f"{naam}.mp4")], check=True)
    schrijf(naam, status="completed"); print(naam, "klaar", flush=True)


if __name__ == "__main__":
    (ROOT / "ai-renders").mkdir(exist_ok=True)
    namen = sys.argv[1:] or list(BEWEGING)
    ids = {}
    for n in namen:  # indienen: één schrijver, sequentieel
        ids[n] = dien_in(n)
    ts = [threading.Thread(target=wacht_en_haal, args=(n, g)) for n, g in ids.items()]
    [t.start() for t in ts]; [t.join() for t in ts]

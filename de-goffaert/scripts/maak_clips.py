"""
Bewegende AI-clips via ElevenLabs Image & Video (veo-3.1-generate-001), staand 9:16, 1080p.
Startframe = staande uitsnede van de bronrender (scripts/crops/cNN.jpg). Het generatie-ID wordt direct
na de POST bewaard in scripts/gen/<naam>.json; een bestaand generatie-ID wordt nooit opnieuw ingediend.

Gebruik: NXT_SCRATCH=<map met prog.py/bridge.py> python3 scripts/maak_clips.py <naam> [<naam> ...]
"""
import hashlib, json, os, subprocess, sys, time, urllib.request, uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GEN = ROOT / "scripts/gen"
sys.path.insert(0, os.environ["NXT_SCRATCH"])
from prog import get  # noqa: E402

SCRATCH = os.environ["NXT_SCRATCH"]
BRIDGE = get() if __name__ == "__main__" else None
API = "https://api.elevenlabs.io/v1"
KEY = {"xi-api-key": "proxy-injected"}
SUFFIX = " One continuous shot, no cuts, no transitions, no morphing. Photorealistic architectural visualisation, preserve the exact architecture, materials and layout, subtle realistic camera movement only."
NEG = "cuts, transitions, morphing, new objects, changed architecture, warping, flicker, text, logos, fast camera movement, cartoon"

# naam: (crop-nr, prompt)
CLIPS = {
    "voorgevel-tuin": (1, "Slow gentle push-in towards the brick and timber apartment building and its garden, leaves swaying softly in the breeze, soft daylight."),
    "binnentuin": (2, "Slow gentle forward glide along the garden path towards the apartment building terraces, grass and plants moving softly in the wind, warm daylight."),
    "straatgevel": (3, "Slow gentle push-in towards the building entrance on the street, soft daylight, tree leaves moving slightly."),
    "avond-gevel": (7, "Slow gentle push-in towards the building at dusk, warm window lights glowing, calm evening atmosphere."),
    "isometrie": (9, "Slow gentle aerial drift over the building and its surroundings, soft daylight, trees swaying slightly."),
    "woonkamer-tuindeuren": (12, "Slow gentle push-in through the living room towards the open garden doors, curtains moving softly in the breeze, warm sunlight."),
    "slaapkamer": (13, "Slow gentle push-in towards the bed in the bedroom, warm sunlight rays and soft shadows moving slightly."),
    "woonkamer-balkon": (14, "Slow gentle pan across the living room towards the balcony doors, sheer curtains moving softly, warm light."),
    "woonkamer-bank": (15, "Slow gentle push-in towards the sofa and olive tree, soft daylight from the window, calm atmosphere."),
    "woonkamer-eethoek": (16, "Slow gentle push-in through the open living and dining area, warm soft light, calm atmosphere."),
}


def req(method, url, body=None, headers=None, raw=False):
    h = dict(KEY)
    h.update(headers or {})
    r = urllib.request.Request(url, data=body, headers=h, method=method)
    with urllib.request.urlopen(r, timeout=300) as resp:
        data = resp.read()
        return (data, dict(resp.headers)) if raw else json.loads(data)


def upload_asset(path, name):
    b = uuid.uuid4().hex
    body = b""
    for k, v in (("name", name),):
        body += f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    body += f'--{b}\r\nContent-Disposition: form-data; name="asset"; filename="{Path(path).name}"\r\nContent-Type: image/jpeg\r\n\r\n'.encode()
    body += Path(path).read_bytes() + f"\r\n--{b}--\r\n".encode()
    return req("POST", f"{API}/assets", body, {"Content-Type": f"multipart/form-data; boundary={b}"})


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def run(naam):
    GEN.mkdir(exist_ok=True)
    led = GEN / f"{naam}.json"
    nr, prompt = CLIPS[naam]
    crop = ROOT / f"scripts/crops/c{nr:02d}.jpg"
    out = ROOT / f"public/clips/{naam}.mp4"
    state = json.loads(led.read_text()) if led.exists() else {}
    if "gen_id" not in state:
        if "uncertain" in state:
            raise SystemExit(f"{naam}: onzekere eerdere POST, handmatig controleren")
        if "asset_id" not in state:
            a = upload_asset(crop, f"goffaert-{naam}")
            state["asset_id"] = a.get("asset_id") or a.get("id")
            led.write_text(json.dumps(state))
        body = {"model_id": "veo-3.1-generate-001", "prompt": prompt + SUFFIX, "negative_prompt": NEG, "aspect_ratio": "9:16",
                "duration_secs": 8, "resolution": "1080p", "generate_audio": False,
                "start_frame": {"type": "asset", "asset_id": state["asset_id"]}}
        state["uncertain"] = True
        led.write_text(json.dumps(state))
        data, hdr = req("POST", f"{API}/flows/video", json.dumps(body).encode(), {"Content-Type": "application/json"}, raw=True)
        gen = json.loads(data)
        state.pop("uncertain")
        state["gen_id"] = gen["id"]
        state["headers"] = {k.lower(): v for k, v in hdr.items() if k.lower() in ("request-id", "character-cost")}
        state["crop_sha256"] = sha(crop)
        led.write_text(json.dumps(state))
        print(naam, "ingediend", gen["id"], state["headers"], flush=True)
        rid = state["headers"].get("request-id") or gen["id"]
        BRIDGE.record_elevenlabs("video", "veo-3.1-generate-001", rid, headers=state["headers"], seconds=8)
    if not out.exists():
        wacht = 15
        for _ in range(120):
            time.sleep(wacht)
            r = req("GET", f"{API}/flows/video/{state['gen_id']}")
            if r["status"] in ("completed", "failed"):
                break
            wacht = min(45, wacht * 1.2)
        if r["status"] != "completed":
            raise SystemExit(f"{naam}: {r.get('failure_reason')} {r.get('error_message')}")
        # content_url is een ondertekende URL: zonder ElevenLabs-sleutel ophalen
        u = urllib.request.Request(r["content_url"], headers={"User-Agent": "Mozilla/5.0"})
        out.write_bytes(urllib.request.urlopen(u, timeout=600).read())
        state["clip_sha256"] = sha(out)
        led.write_text(json.dumps(state))
    print(naam, "klaar", flush=True)


if __name__ == "__main__":
    for n in sys.argv[1:]:
        run(n)

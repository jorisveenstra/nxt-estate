"""Veo 3.1 image-to-video (9:16, 1080p, 8s) voor één portret-startframe. Ledger: STATE/veo-ledger.json"""
import sys, json, time, hashlib, fcntl, uuid, pathlib, subprocess, urllib.request
from common import *
ROOT = pathlib.Path(__file__).resolve().parent.parent
LED = STATE / "veo-ledger.json"
PROMPTS = {
 "luchtfoto": "Slow, smooth aerial drone move gently forward and slightly down over the new business buildings, parking and water; subtle natural light.",
 "voorgevel": "Very slow, steady push-in toward the building facade; gentle natural daylight, leaves moving slightly in the breeze.",
 "hoekpand": "Slow subtle camera glide to the right along the street-facing facade of the corner building; calm daylight.",
 "avond": "Slow gentle push-in on the building at dusk, warm interior lights glowing, soft ambient evening light.",
 "stellingen": "Slow steady dolly forward through the high hall between the tall racks; the forklift stays parked, quiet and calm.",
 "hal": "Slow gentle push-in into the tall hall interior, soft light from the windows, nothing else changes.",
 "dakterras": "Slow subtle camera drift along the roof terrace railing, calm daylight, plants moving very slightly.",
 "dakterras-2": "Slow gentle push-in on the roof terrace with greenery, calm daylight.",
 "straat": "Slow steady forward glide along the paved street between the units with overhead doors, calm daylight.",
 "water": "Slow gentle camera drift to the right, buildings across the water, light ripples on the water, calm evening light.",
}
SUFFIX = " Preserve the architecture, proportions, materials and layout exactly. One continuous shot, no cuts, no transitions, no morphing. No people appear, no text."
NEG = "morphing, warping, new objects, changed architecture, text, logos, cartoon, fast camera movement, cuts, transitions"
def led(fn=None):
    LED.touch()
    with LED.open("r+") as f:
        fcntl.flock(f, fcntl.LOCK_EX); t = f.read(); d = json.loads(t) if t else {}
        if fn: fn(d); f.seek(0); f.truncate(); f.write(json.dumps(d, indent=1))
        return d
def run(name):
    img = ROOT / f"public/portrait/{name}.jpg"; out = ROOT / f"public/clips/{name}.mp4"
    sha = hashlib.sha256(img.read_bytes()).hexdigest()
    e = led().get(name, {})
    if "gen_id" not in e:
        boundary = uuid.uuid4().hex
        parts = (f'--{boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nmark3-{name}\r\n'
                 f'--{boundary}\r\nContent-Disposition: form-data; name="asset"; filename="{name}.jpg"\r\nContent-Type: image/jpeg\r\n\r\n').encode() + img.read_bytes() + f'\r\n--{boundary}--\r\n'.encode()
        b, _ = el("POST", "/v1/assets", raw=parts, headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
        asset = json.loads(b); aid = asset.get("asset_id") or asset.get("id")
        led(lambda d: d.setdefault(name, {}).update(asset_id=aid, source_sha256=sha))
        body = {"model_id": "veo-3.1-generate-001", "prompt": PROMPTS[name] + SUFFIX, "negative_prompt": NEG, "aspect_ratio": "9:16",
                "duration_secs": 8, "resolution": "1080p", "generate_audio": False, "start_frame": {"type": "asset", "asset_id": aid}}
        b, h = el("POST", "/v1/flows/video", body)
        g = json.loads(b)
        led(lambda d: d[name].update(gen_id=g["id"], headers={k: v for k, v in h.items() if k.lower() not in ("set-cookie",)}))
        print(name, "ingediend", g["id"], flush=True)
    e = led()[name]
    if not out.exists():
        wait = 15
        for _ in range(100):
            time.sleep(wait)
            b, _ = el("GET", f"/v1/flows/video/{e['gen_id']}"); r = json.loads(b)
            if r["status"] in ("completed", "failed"): break
            wait = min(45, wait * 1.2)
        if r["status"] != "completed": print(name, "MISLUKT", r.get("failure_reason"), r.get("error_message"), flush=True); return
        req = urllib.request.Request(r["content_url"], headers={"User-Agent": "curl/8.5.0"})
        out.write_bytes(urllib.request.urlopen(req, timeout=300).read())
    p = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,sample_aspect_ratio,duration:stream_side_data=rotation", "-of", "json", str(out)], capture_output=True, text=True).stdout
    led(lambda d: d[name].update(probe=json.loads(p)))
    print(name, "klaar", p.replace("\n", ""), flush=True)
if __name__ == "__main__":
    import concurrent.futures as cf
    with cf.ThreadPoolExecutor(5) as ex: list(ex.map(run, sys.argv[1:]))

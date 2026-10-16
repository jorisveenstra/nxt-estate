"""
Foto -> bewegende clip via ElevenLabs Image & Video (veo-3.1-generate-001), staand 9:16, 1080x1920.
Gebruik: python3 scripts/veo_clip.py <nr>
Ledger per foto: scripts/veo-ledger/foto<nr>.json (generation-id wordt direct na indienen bewaard;
een bestaand ledger wordt nooit opnieuw ingediend). Authenticatie loopt via de proxy (xi-api-key wordt
door het netwerk ingevoegd); er staat geen sleutel in deze repo.
"""
import json, subprocess, sys, time, urllib.request, uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "scripts/veo-ledger"
API = "https://api.elevenlabs.io/v1"
NEG = "people walking fast, new objects, changed architecture, distortion, warping, morphing, flicker, text, cartoon, fast camera movement, cuts, transitions"
PROMPTS = {
 1: "aerial drone view of the new business units, the camera slowly glides forward and descends a little over the building",
 2: "aerial view, the camera slowly glides sideways along the terraces and the roof with solar panels",
 3: "the camera slowly moves forward towards the corner of the building and the BN sign, soft daylight",
 4: "the camera slowly glides forward along the street towards the facade with the overhead doors",
 5: "the camera slowly moves to the right along the corner of the building with cars parked at the doors",
 6: "the camera slowly pushes in towards the large black overhead door of the unit",
 7: "the camera slowly glides to the right past the facade and the parked car in front of the unit",
 8: "the camera slowly moves forward across the parking area towards the units with overhead doors",
 9: "the camera slowly tilts up along the vertical cladding of the facade towards the sky",
 10: "the camera slowly moves forward towards the entrance and the stone BN sign",
 11: "the camera slowly glides along the roof terrace, people standing quietly, gentle movement",
 12: "evening scene, the camera slowly moves forward, the windows glow warmly, slight movement of the clouds",
 13: "evening scene, the camera slowly glides to the right along the illuminated facade",
}

def req(url, data=None, headers=None, method=None):
    r = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    with urllib.request.urlopen(r, timeout=300) as resp:
        return json.loads(resp.read())

def upload_asset(path, name):
    b = uuid.uuid4().hex
    body = b""
    body += f'--{b}\r\nContent-Disposition: form-data; name="name"\r\n\r\n{name}\r\n'.encode()
    body += f'--{b}\r\nContent-Disposition: form-data; name="asset"; filename="{name}.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'.encode() + Path(path).read_bytes() + b"\r\n"
    body += f"--{b}--\r\n".encode()
    return req(f"{API}/assets", body, {"Content-Type": f"multipart/form-data; boundary={b}"})

def main():
    n = int(sys.argv[1])
    LEDGER.mkdir(exist_ok=True)
    lp = LEDGER / f"foto{n}.json"
    led = json.loads(lp.read_text()) if lp.exists() else {}
    if "asset_id" not in led:
        a = upload_asset(ROOT / f"portrait/foto{n}.jpg", f"elbe23-foto{n}-portrait")
        led["asset_id"] = a.get("asset_id") or a.get("id")
        led["asset_raw"] = a
        lp.write_text(json.dumps(led, indent=1))
    if "generation_id" not in led:
        body = {"model_id": "veo-3.1-generate-001",
                "prompt": PROMPTS[n] + ". Preserve the architecture exactly. One continuous shot, no cuts, no transitions, no morphing.",
                "negative_prompt": NEG, "start_frame": {"type": "asset", "asset_id": led["asset_id"]},
                "resolution": "1080p", "duration_secs": 8, "generate_audio": False, "aspect_ratio": "9:16"}
        led["submitting"] = True
        lp.write_text(json.dumps(led, indent=1))
        g = req(f"{API}/flows/video", json.dumps(body).encode(), {"Content-Type": "application/json"})
        led["generation_id"] = g["id"]; led.pop("submitting", None); led["submit_raw"] = g
        lp.write_text(json.dumps(led, indent=1))
        print(n, "ingediend", g["id"], flush=True)
    elif led.get("submitting") and "generation_id" not in led:
        sys.exit("onzeker resultaat eerdere indiening: handmatig controleren")
    out = ROOT / f"public/clips/foto{n}.mp4"
    wacht = 15
    while True:
        time.sleep(wacht)
        r = req(f"{API}/flows/video/{led['generation_id']}")
        if r["status"] in ("completed", "failed"):
            break
        wacht = min(45, wacht * 1.2)
    led["result"] = {k: v for k, v in r.items() if k != "content_url"}
    lp.write_text(json.dumps(led, indent=1))
    if r["status"] != "completed":
        sys.exit(f"{n}: mislukt {r}")
    with urllib.request.urlopen(r["content_url"], timeout=600) as resp:  # geen credentials naar de contenthost
        out.write_bytes(resp.read())
    p = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,sample_aspect_ratio,duration:stream_side_data=rotation", "-of", "json", str(out)], capture_output=True, text=True).stdout
    led["probe"] = json.loads(p); lp.write_text(json.dumps(led, indent=1))
    print(n, "klaar", p.replace("\n", " "), flush=True)

if __name__ == "__main__":
    main()

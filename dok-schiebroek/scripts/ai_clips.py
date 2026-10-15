"""
Foto -> bewegende AI-clip via ElevenLabs Image & Video (veo-3.1-generate-001, 1080p, 8 s, 9:16).

Per unieke bronfoto: snij een 9:16-startframe, upload als asset, dien de generatie in, bewaar het
generation-id METEEN in scripts/ai_clips_ledger.json (nooit blind opnieuw indienen), poll en download.
Gebruik: python3 scripts/ai_clips.py <bronmap>   (xi-api-key via proxy of ELEVENLABS_API_KEY)
"""
import hashlib, json, os, subprocess, sys, threading, time, urllib.request, uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "scripts/ai_clips_ledger.json"
LOCK = threading.Lock()
API = "https://api.elevenlabs.io/v1"
HDR = {"xi-api-key": os.environ["ELEVENLABS_API_KEY"]} if os.environ.get("ELEVENLABS_API_KEY") else {}
NEG = ("new people appearing, extra objects, new furniture, changing the building, altered facade, text changes, logos, "
       "distortion, warping, morphing, flicker, cartoon, fast camera movement, cuts")
CAM = "Subtle, slow, realistic camera movement; photorealistic; keep every building, proportion, material, window and layout exactly as in the image."

# naam: (bronbestand, x-focus 0..1 voor 9:16-uitsnede, prompt)
CLIPS = {
    "drone-1": ("00_", 0.55, "Slow cinematic drone push-in over the small business park, trees and water gently swaying, cars standing still. " + CAM),
    "drone-2": ("01_", 0.65, "Slow cinematic drone drift forward toward the two business buildings, light cloud movement, traffic on the distant motorway. " + CAM),
    "ext-1": ("02_", 0.60, "Gentle slow push-in on the business building facade, a cyclist slowly rides past, leaves moving softly in the breeze. " + CAM),
    "ext-2": ("04_", 0.55, "Slow gentle dolly sideways along the two-storey building facade with the green wall, leaves and a cyclist moving subtly. " + CAM),
    "ext-3": ("06_", 0.40, "Slow gentle push-in toward the building with its overhead doors, grass moving softly in the wind, clouds drifting. " + CAM),
    "ext-4": ("08_", 0.62, "Slow gentle push-in on the corner of the building with the green wall, tree leaves moving softly, people standing calmly. " + CAM),
    "ext-5": ("10_", 0.50, "Slow gentle push-in on the facade with large windows and overhead doors, a cyclist rides slowly past. " + CAM),
    "ext-6": ("12_", 0.62, "Slow gentle push-in toward the entrance of the business unit, people walk calmly, soft daylight. " + CAM),
    "bg-a1": ("14_", 0.40, "Slow gentle push-in inside the bright showroom studio, people calmly working at the table, soft daylight. " + CAM),
    "bg-c1": ("15_", 0.55, "Slow gentle push-in inside the workshop with the van, the technician works calmly, soft light. " + CAM),
    "bg-d1": ("16_", 0.50, "Slow gentle push-in toward the open overhead door of the workshop unit, someone works calmly at the bench. " + CAM),
    "tv-a1": ("17_", 0.65, "Slow gentle push-in on the modern office, the person works at the desk, soft warm light. " + CAM),
    "tv-c1": ("18_", 0.35, "Slow gentle push-in on the bright studio space, people stretch calmly, sunlight moving softly through the windows. " + CAM),
}


def req(method, url, data=None, headers=None, timeout=300):
    r = urllib.request.Request(url, data=data, method=method, headers={**HDR, **(headers or {})})
    with urllib.request.urlopen(r, timeout=timeout) as resp:
        return json.loads(resp.read())


def ledger():
    with LOCK:
        return json.loads(LEDGER.read_text()) if LEDGER.exists() else {}


def save(naam, **kw):
    with LOCK:
        l = json.loads(LEDGER.read_text()) if LEDGER.exists() else {}
        l.setdefault(naam, {}).update(kw)
        LEDGER.with_suffix(".tmp").write_text(json.dumps(l, indent=1)); LEDGER.with_suffix(".tmp").replace(LEDGER)


def multipart(fields, fname, fbytes):
    b = uuid.uuid4().hex
    out = b""
    for k, v in fields.items():
        out += f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    out += f'--{b}\r\nContent-Disposition: form-data; name="asset"; filename="{fname}"\r\nContent-Type: image/jpeg\r\n\r\n'.encode() + fbytes + f"\r\n--{b}--\r\n".encode()
    return out, {"Content-Type": f"multipart/form-data; boundary={b}"}


def crop(src, x, uit):
    w, h = [int(v) for v in subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", str(src)], capture_output=True, text=True).stdout.strip().split("x")]
    cw = int(h * 9 / 16); x0 = int(min(max(x * w - cw / 2, 0), w - cw))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vf", f"crop={cw}:{h}:{x0}:0,scale=1080:1920:flags=lanczos", "-q:v", "2", str(uit)], check=True)


def run(naam, bron):
    pre, x, prompt = CLIPS[naam]
    src = next(Path(bron).glob(pre + "*"))
    frame = ROOT / f"public/ai-bron/{naam}.jpg"
    if not frame.exists():
        crop(src, x, frame)
    L = ledger().get(naam, {})
    if L.get("status") == "failed" and L.get("fout") in ("model_error",) or "not charged" in (L.get("fout") or ""):  # aantoonbaar niet in rekening gebracht -> veilig opnieuw
        save(naam, eerdere_mislukte_ids=L.get("eerdere_mislukte_ids", []) + [L["generation_id"]], status=None, fout=None)
        L = {k: v for k, v in ledger()[naam].items() if k != "generation_id"}
        with LOCK:
            l = json.loads(LEDGER.read_text()); l[naam].pop("generation_id", None); LEDGER.write_text(json.dumps(l, indent=1))
    save(naam, bron_sha256=hashlib.sha256(src.read_bytes()).hexdigest(), bron=src.name, prompt=prompt)
    if "generation_id" not in L:
        if "asset_id" not in L:
            body, h = multipart({"name": f"dok-schiebroek-{naam}"}, frame.name, frame.read_bytes())
            a = req("POST", f"{API}/assets", body, h)
            save(naam, asset_id=a.get("asset_id") or a.get("id"))
            L = ledger()[naam]
        gen = req("POST", f"{API}/flows/video", json.dumps({
            "model_id": "veo-3.1-generate-001", "prompt": prompt, "negative_prompt": NEG,
            "start_frame": {"type": "asset", "asset_id": L["asset_id"]}, "resolution": "1080p", "duration_secs": 8,
            "generate_audio": False, "aspect_ratio": "9:16"}).encode(), {"Content-Type": "application/json"})
        save(naam, generation_id=gen["id"])
        print(naam, "ingediend", gen["id"], flush=True)
    gid = ledger()[naam]["generation_id"]
    uit = ROOT / f"public/clips/{naam}.mp4"
    wacht = 15
    for _ in range(120):
        r = req("GET", f"{API}/flows/video/{gid}")
        if r["status"] in ("completed", "failed"):
            break
        time.sleep(wacht); wacht = min(45, wacht * 1.2)
    if r["status"] != "completed":
        save(naam, status="failed", fout=str(r.get("error_message") or r.get("failure_reason"))); print(naam, "MISLUKT", r.get("failure_reason"), flush=True); return
    # content_url: geen provider-credentials meesturen
    uit.write_bytes(urllib.request.urlopen(r["content_url"], timeout=300).read())
    save(naam, status="completed"); print(naam, "klaar", flush=True)


if __name__ == "__main__":
    bron = sys.argv[1]; namen = sys.argv[2:] or list(CLIPS)
    (ROOT / "public/clips").mkdir(exist_ok=True); (ROOT / "public/ai-bron").mkdir(exist_ok=True)
    ts = [threading.Thread(target=run, args=(n, bron)) for n in namen]
    [t.start() for t in ts]; [t.join() for t in ts]

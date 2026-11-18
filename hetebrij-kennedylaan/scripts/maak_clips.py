"""
Bewegende beelden via ElevenLabs Image & Video (Veo 3.1, veo-3.1-generate-001), staand 9:16, 1080p.

Per shot uit scripts/shots.json:
  1. bronnen/staand/<shot>.png (echte 1080x1920 crop van de originele render) -> POST /v1/assets
  2. POST /v1/flows/video met start_frame asset, aspect_ratio 9:16, 1080p, 8 s, zonder audio
  3. pollen tot completed, downloaden naar public/clips/<shot>.mp4, controleren met ffprobe (1080x1920)

Alles staat in scripts/veo-ledger.json (asset-id, generation-id, sha256 van startframe en clip).
Een generatie die is ingediend maar geen resultaat heeft, wordt NIET opnieuw ingediend.
Authenticatie: proxy-geïnjecteerde xi-api-key (of ELEVENLABS_API_KEY in de omgeving).
Optioneel NXT_BRIDGE_DIR: verbruik melden via de portal-bridge.

Gebruik: python3 scripts/maak_clips.py [shot ...]
"""
import hashlib, json, os, subprocess, sys, threading, time, urllib.error, urllib.request, uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "scripts/veo-ledger.json"
LOCK = threading.Lock()
MODEL = "veo-3.1-generate-001"
STIJL = ("Photorealistic architectural visualisation, keep every building, window, door, brick, paving and plant "
         "exactly as in the start image, same proportions, materials and layout. ")
EIND = " One continuous shot, no cuts, no transitions, no morphing. No text, no logos, no new buildings."
PROMPTS = {
    "straat-hoekwoning": "Slow gentle push-in toward the brick corner house and its front doors on a sunny day; clouds drift softly, leaves move slightly in the breeze.",
    "hoek-bewoners": "Slow smooth lateral dolly along the brick corner house with the green lawn in front; the residents walk calmly, flowers sway gently, clouds drift.",
    "laan-gezinnen": "Slow gentle push-in along the street toward the row of brick houses; the mother and children walk slowly on the pavement, tree leaves move softly in the breeze.",
    "groen-avondzon": "Slow gentle push-in toward the brick terraced houses in warm evening sunlight; the couple walks calmly along the path, grass and trees sway softly.",
    "groen-avondzon-v2": "Locked-off static camera on a tripod, almost no camera movement, framing stays exactly as the start image; only the couple walks slowly along the path and the grass and leaves move gently in warm evening light. Do not reveal anything outside the frame.",
    "woonkamer": "Slow smooth dolly forward through the bright living room with sofa and coffee table; soft daylight, the candle flickers gently, otherwise everything stays still.",
    "slaapkamer": "Slow gentle push-in toward the bed and the large window in the calm bedroom; soft daylight, the plant leaves move very slightly.",
    "kinderkamer": "Slow gentle push-in toward the small bedroom window and bed; soft daylight, the trees outside the window sway lightly.",
    "plattegrond-bg": "Very slow smooth orbit and push-in over the 3D cutaway floor plan model of the terraced houses on a white background; the model stays exactly the same.",
}


def headers(extra=None):
    h = {"User-Agent": "video-ads/1.0"}
    if os.environ.get("ELEVENLABS_API_KEY"):
        h["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
    h.update(extra or {})
    return h


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def ledger_update(shot, **kw):
    with LOCK:
        d = json.loads(LEDGER.read_text()) if LEDGER.exists() else {}
        d.setdefault(shot, {}).update(kw)
        LEDGER.write_text(json.dumps(d, indent=1))
        return d[shot]


def ledger(shot):
    with LOCK:
        d = json.loads(LEDGER.read_text()) if LEDGER.exists() else {}
        return d.get(shot, {})


def call(url, data=None, ctype="application/json", method=None):
    req = urllib.request.Request(url, data=data, headers=headers({"Content-Type": ctype} if data else None),
                                 method=method or ("POST" if data else "GET"))
    try:
        r = urllib.request.urlopen(req, timeout=180)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"HTTP {e.code} op {url.split('?')[0]}: {e.read(500)!r}")
    with r:
        return {k.lower(): v for k, v in r.headers.items()}, json.loads(r.read())


def upload_asset(path, name):
    bnd = uuid.uuid4().hex
    body = (f"--{bnd}\r\nContent-Disposition: form-data; name=\"name\"\r\n\r\n{name}\r\n"
            f"--{bnd}\r\nContent-Disposition: form-data; name=\"asset\"; filename=\"{name}.png\"\r\n"
            f"Content-Type: image/png\r\n\r\n").encode() + Path(path).read_bytes() + f"\r\n--{bnd}--\r\n".encode()
    return call("https://api.elevenlabs.io/v1/assets", body, f"multipart/form-data; boundary={bnd}")


def probe(p):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries",
                          "stream=width,height,sample_aspect_ratio:stream_side_data=rotation:format=duration",
                          "-of", "json", str(p)], capture_output=True, text=True).stdout
    return json.loads(out)


def run(shot, bridge):
    start = ROOT / f"bronnen/staand/{shot.removesuffix('-v2')}.png"
    out = ROOT / f"public/clips/{shot}.mp4"
    L = ledger(shot)
    if out.exists() and L.get("clip_sha256") == sha(out):
        return shot, "al aanwezig"
    if L.get("start_sha256") and L["start_sha256"] != sha(start):
        raise SystemExit(f"{shot}: startframe gewijzigd sinds eerdere generatie")
    if not L.get("asset_id"):
        if L.get("asset_upload_started"):
            raise SystemExit(f"{shot}: onzekere asset-upload, handmatig controleren")
        ledger_update(shot, asset_upload_started=True, start_sha256=sha(start))
        _, a = upload_asset(start, f"hetebrij-kennedylaan-{shot}-9x16")
        L = ledger_update(shot, asset_id=a.get("asset_id") or a.get("id"), asset_response_keys=list(a.keys()))
    if not L.get("generation_id"):
        if L.get("generation_submitted"):
            raise SystemExit(f"{shot}: onzekere video-aanvraag, NIET opnieuw indienen")
        prompt = STIJL + PROMPTS[shot] + EIND
        ledger_update(shot, generation_submitted=True, prompt=prompt, model_id=MODEL)
        body = {"model_id": MODEL, "prompt": prompt, "start_frame": {"type": "asset", "asset_id": L["asset_id"]},
                "resolution": "1080p", "duration_secs": 8, "generate_audio": False, "aspect_ratio": "9:16"}
        h, g = call("https://api.elevenlabs.io/v1/flows/video", json.dumps(body).encode())
        rid = h.get("request-id") or h.get("x-request-id")
        L = ledger_update(shot, generation_id=g["id"], request_id=rid, character_cost=h.get("character-cost"),
                          response_header_names=sorted(h))
        print(shot, "ingediend", g["id"], "cost", h.get("character-cost"), flush=True)
        if bridge:
            # Geen request-id-header bij flows/video: de generation-id is dan de provider-operatie-ID.
            with LOCK:
                print(shot, "usage", bridge.record_elevenlabs("video", MODEL, rid or g["id"],
                      headers=h if rid else {k: v for k, v in h.items() if k != "request-id"}, seconds=8), flush=True)
    wacht = 20
    for _ in range(120):
        _, r = call(f"https://api.elevenlabs.io/v1/flows/video/{L['generation_id']}")
        if r.get("status") in ("completed", "failed"):
            break
        time.sleep(wacht)
        wacht = min(45, wacht * 1.2)
    if r.get("status") != "completed":
        ledger_update(shot, status=r.get("status"), failure=str(r.get("failure_reason") or r.get("error_message")))
        raise SystemExit(f"{shot}: {r.get('status')} {r.get('failure_reason')} {r.get('error_message')}")
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(".part")
    subprocess.run(["curl", "-sS", "--fail", "-o", str(tmp), r["content_url"]], check=True)
    info = probe(tmp)
    st = info["streams"][0]
    ok = st["width"] == 1080 and st["height"] == 1920 and st.get("sample_aspect_ratio", "1:1") in ("1:1", "N/A")
    ledger_update(shot, status="completed", width=st["width"], height=st["height"],
                  duration=float(info["format"]["duration"]), geometry_ok=ok,
                  result_keys=[k for k in r.keys() if k != "content_url"])
    tmp.rename(out if ok else out.with_suffix(".afgekeurd.mp4"))
    if not ok:
        raise SystemExit(f"{shot}: verkeerde geometrie {st['width']}x{st['height']}")
    ledger_update(shot, clip_sha256=sha(out))
    return shot, f"klaar {st['width']}x{st['height']} {info['format']['duration']}s"


def main():
    bridge = None
    if os.environ.get("NXT_BRIDGE_DIR"):
        sys.path.insert(0, os.environ["NXT_BRIDGE_DIR"])
        import b as _b
        bridge = _b.bridge()
    shots = sys.argv[1:] or list(PROMPTS)
    with ThreadPoolExecutor(4) as ex:
        futs = [ex.submit(run, s, bridge) for s in shots]
        for f in futs:
            try:
                print(*f.result(), flush=True)
            except SystemExit as e:
                print("FOUT", e, flush=True)


if __name__ == "__main__":
    main()

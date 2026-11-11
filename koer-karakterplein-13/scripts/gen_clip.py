"""ElevenLabs Image & Video (veo-3.1-generate-001): portret-startbeeld -> 1080x1920 clip. Ledger: scripts/gen_ledger.json
Gebruik: python3 scripts/gen_clip.py <shot>   (herhaalt NOOIT een eerder ingediende generatie; hervat alleen het pollen)"""
import json, sys, time, subprocess, fcntl, uuid, urllib.request, os
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "scripts/gen_ledger.json"
API = "https://api.elevenlabs.io"
NEG = "one continuous shot, no cuts, no transitions, no morphing. Faithfully preserve the building, proportions, materials and layout; no people, no text."

def ledger(update=None):
    fd = os.open(LEDGER, os.O_CREAT | os.O_RDWR)
    with os.fdopen(fd, "r+") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        raw = f.read(); d = json.loads(raw) if raw else {}
        if update:
            d = update(d); f.seek(0); f.truncate(); json.dump(d, f, indent=1); f.flush(); os.fsync(f.fileno())
        return d

def call(method, path, body=None, headers=None, raw=False):
    h = {"xi-api-key": "proxy-injected"}; h.update(headers or {})
    req = urllib.request.Request(API + path, data=body, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=300) as r:
        data = r.read(); hd = dict(r.headers)
    return (json.loads(data), hd) if not raw else (data, hd)

def multipart(fields, fname, fbytes):
    b = uuid.uuid4().hex; out = b""
    for k, v in fields.items(): out += f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    out += f'--{b}\r\nContent-Disposition: form-data; name="asset"; filename="{fname}"\r\nContent-Type: image/jpeg\r\n\r\n'.encode() + fbytes + f'\r\n--{b}--\r\n'.encode()
    return out, {"Content-Type": "multipart/form-data; boundary=" + b}

def main(shot):
    shots = json.load(open(ROOT / "scripts/shots.json")); hashes = json.load(open(ROOT / "scripts/start_hashes.json"))
    s = shots[shot]; entry = ledger().get(shot, {})
    if not entry.get("generation_id"):
        if not entry.get("asset_id"):
            body, h = multipart({"name": f"koer-{shot}"}, f"{shot}.jpg", (ROOT / "start" / f"{shot}.jpg").read_bytes())
            r, hd = call("POST", "/v1/assets", body, h)
            aid = r.get("asset_id") or r.get("id")
            ledger(lambda d: {**d, shot: {**d.get(shot, {}), "asset_id": aid, "start_sha256": hashes[shot]["start_sha256"], "source_sha256": hashes[shot]["source_sha256"]}})
            entry = ledger()[shot]
        payload = {"model_id": "veo-3.1-generate-001", "prompt": s["prompt"] + ". " + NEG, "start_frame": {"type": "asset", "asset_id": entry["asset_id"]},
                   "resolution": "1080p", "duration_secs": 8, "generate_audio": False, "aspect_ratio": "9:16"}
        ledger(lambda d: {**d, shot: {**d[shot], "submitting": True}})  # voor de POST: bij onzekerheid niet blind herhalen
        r, hd = call("POST", "/v1/flows/video", json.dumps(payload).encode(), {"Content-Type": "application/json"})
        gid = r.get("generation_id") or r.get("id")
        rid = hd.get("request-id") or hd.get("Request-Id")
        ledger(lambda d: {**d, shot: {**d[shot], "generation_id": gid, "request_id": rid, "post_headers": {k: v for k, v in hd.items() if k.lower() in ("request-id", "character-cost")}, "post_response": {k: v for k, v in r.items() if k != "content_url"}}})
        entry = ledger()[shot]
    gid = entry["generation_id"]
    while True:
        r, hd = call("GET", f"/v1/flows/video/{gid}")
        st = r.get("status")
        if st in ("completed", "complete", "succeeded") or r.get("content_url"):
            break
        if st in ("failed", "error"):
            ledger(lambda d: {**d, shot: {**d[shot], "status": "failed", "error": str(r)[:300]}}); raise SystemExit(f"{shot} failed: {str(r)[:300]}")
        time.sleep(15)
    out = ROOT / "public/clips" / f"{shot}.mp4"
    req = urllib.request.Request(r["content_url"], headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=600) as rr: out.write_bytes(rr.read())
    p = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(out)], capture_output=True, check=True).stdout)
    v = next(x for x in p["streams"] if x["codec_type"] == "video")
    ledger(lambda d: {**d, shot: {**d[shot], "status": "downloaded", "width": v["width"], "height": v["height"], "sar": v.get("sample_aspect_ratio"), "duration": float(p["format"]["duration"]), "final_response": {k: x for k, x in r.items() if k != "content_url"}}})
    print(shot, v["width"], v["height"], v.get("sample_aspect_ratio"), p["format"]["duration"])

if __name__ == "__main__":
    main(sys.argv[1])

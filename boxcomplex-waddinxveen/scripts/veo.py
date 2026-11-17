"""Bewegende clips via ElevenLabs Image & Video (veo-3.1-generate-001, 1080p, 9:16) vanuit staande startbeelden.
generate(key, ...) legt elke stap vast in generatie/ledger.json en herhaalt nooit een onzekere POST.
"""
import json, uuid, time, subprocess, pathlib, urllib.request
from el import request, ledger_get, ledger_update, ROOT

MODEL = "veo-3.1-generate-001"
SUFFIX = " One continuous shot, no cuts, no transitions, no morphing. Keep the architecture, proportions, materials, signage and layout exactly as in the start image; photorealistic."

def upload_asset(path, name):
    boundary = "----b" + uuid.uuid4().hex
    data = pathlib.Path(path).read_bytes()
    body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"name\"\r\n\r\n{name}\r\n"
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"asset\"; filename=\"{pathlib.Path(path).name}\"\r\n"
            f"Content-Type: image/png\r\n\r\n").encode() + data + f"\r\n--{boundary}--\r\n".encode()
    st, h, raw = request("POST", "/v1/assets", raw=body, ctype="multipart/form-data; boundary=" + boundary)
    if st >= 300:
        raise RuntimeError(f"asset upload {st}: {raw[:300]!r}")
    j = json.loads(raw)
    return j.get("asset_id") or j.get("id") or j

def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,sample_aspect_ratio:stream_side_data=rotation:format=duration",
                          "-of", "json", str(path)], capture_output=True, check=True).stdout
    return json.loads(out)

def generate(key, start_png, prompt, on_usage=None, log=print):
    out = ROOT / "public" / "clips" / f"{key}.mp4"
    rec = ledger_get("veo:" + key) or {}
    if rec.get("status") == "klaar" and out.exists():
        return out
    if not rec.get("asset_id"):
        aid = upload_asset(start_png, key)
        rec = ledger_update("veo:" + key, asset_id=aid, model=MODEL, startframe=str(pathlib.Path(start_png).relative_to(ROOT)))
    if not rec.get("generation_id"):
        if rec.get("status") == "verzonden":
            raise RuntimeError(f"{key}: eerdere POST onzeker, niet blind herhalen")
        body = {"model_id": MODEL, "prompt": prompt + SUFFIX, "start_frame": {"type": "asset", "asset_id": rec["asset_id"]},
                "resolution": "1080p", "duration_secs": 8, "generate_audio": False, "aspect_ratio": "9:16"}
        ledger_update("veo:" + key, status="verzonden", prompt=body["prompt"], settings={k: v for k, v in body.items() if k != "prompt"})
        st, h, raw = request("POST", "/v1/flows/video", body)
        if st >= 300:
            ledger_update("veo:" + key, status="afgewezen", error=f"{st}: {raw[:300].decode(errors='ignore')}")
            raise RuntimeError(f"{key}: flows/video {st}: {raw[:300]!r}")
        j = json.loads(raw)
        gid = j.get("id") or j.get("generation_id")
        rid = {k.lower(): v for k, v in h.items()}.get("request-id") or gid
        rec = ledger_update("veo:" + key, status="ingediend", generation_id=gid, request_id=rid,
                            headers={k: v for k, v in h.items() if k.lower() in ("request-id", "character-cost", "x-character-count")})
        if on_usage:
            on_usage("video", MODEL, rid, h)
        log(f"{key}: ingediend {gid}")
    gid = rec["generation_id"]
    wait = 20
    for _ in range(120):
        st, h, raw = request("GET", f"/v1/flows/video/{gid}")
        if st < 300:
            j = json.loads(raw)
            if j.get("status") in ("completed", "failed"):
                break
        time.sleep(wait); wait = min(45, wait * 1.2)
    else:
        raise RuntimeError(f"{key}: timeout")
    if j["status"] != "completed":
        ledger_update("veo:" + key, status="mislukt", error=str(j.get("failure_reason") or j.get("error_message")))
        raise RuntimeError(f"{key}: mislukt {j.get('failure_reason')}")
    req = urllib.request.Request(j["content_url"], headers={"User-Agent": "video-ads-agent/1.0"})
    tmp = out.with_suffix(".part")
    with urllib.request.urlopen(req, timeout=600) as r:
        tmp.write_bytes(r.read())
    tmp.rename(out)
    info = probe(out)
    s = info["streams"][0]
    ledger_update("veo:" + key, status="klaar", width=s["width"], height=s["height"],
                  duration=float(info["format"]["duration"]), result={k: v for k, v in j.items() if "url" not in k})
    log(f"{key}: klaar {s['width']}x{s['height']}")
    return out

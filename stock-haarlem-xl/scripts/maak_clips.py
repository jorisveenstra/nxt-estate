"""Image-to-video (veo-3.1-generate-001, 1080p, 9:16, 8 s) vanuit staande startbeelden.

Gebruik: python3 scripts/maak_clips.py naam=bronnen/startbeelden/x.png ...
"""
import hashlib, json, subprocess, sys, time, uuid, urllib.request
from concurrent.futures import ThreadPoolExecutor
from el import Ledger, paid, request, report, ROOT

MODEL = "veo-3.1-generate-001"
PROMPTS = {
    "showroom": "Bright Scandinavian-style showroom interior with white arches, black steel staircase and large windows. Very slow, smooth dolly forward through the arch. Keep the architecture, materials, furniture and proportions exactly as in the image. Natural daylight, realistic. One continuous shot, no cuts, no transitions, no morphing.",
    "studio": "Bright design studio with concrete ceiling, large black-framed windows and herringbone oak floor. Very slow, smooth lateral camera slide along the windows with soft sunlight. Keep the architecture, windows, furniture and proportions exactly as in the image. Realistic. One continuous shot, no cuts, no transitions, no morphing.",
    "werkruimte": "Light open workspace with concrete ceiling, round stone table with flowers and windows in the back. Very slow, gentle push-in towards the windows, natural daylight. Keep the architecture, furniture, materials and proportions exactly as in the image. Realistic. One continuous shot, no cuts, no transitions, no morphing.",
}


def probe(p):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries",
                          "stream=width,height,sample_aspect_ratio:stream_side_data=rotation", "-of", "json", str(p)],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)["streams"][0]


def maak(naam, beeld):
    led = Ledger()
    beeld = ROOT / beeld
    sha = hashlib.sha256(beeld.read_bytes()).hexdigest()
    s = probe(beeld)
    assert (s["width"], s["height"]) == (1080, 1920), "startbeeld moet 1080x1920 zijn"
    uit = ROOT / f"public/clips/{naam}.mp4"
    # 1. asset upload (niet betaald, wel idempotent bewaard)
    akey = f"asset:{sha}"
    a = led.get(akey)
    if not a:
        b = "----nxt" + uuid.uuid4().hex
        body = (f"--{b}\r\nContent-Disposition: form-data; name=\"name\"\r\n\r\n{beeld.name}\r\n"
                f"--{b}\r\nContent-Disposition: form-data; name=\"asset\"; filename=\"{beeld.name}\"\r\n"
                f"Content-Type: image/png\r\n\r\n").encode() + beeld.read_bytes() + f"\r\n--{b}--\r\n".encode()
        content, hdr = request("POST", "/v1/assets", raw=body, headers={"Content-Type": f"multipart/form-data; boundary={b}"})
        resp = json.loads(content)
        a = led.update(akey, lambda _: {"asset_id": resp.get("asset_id") or resp.get("id"), "response_keys": list(resp)})
    # 2. generatie
    gkey = f"video:{naam}:{sha}"
    g = led.get(gkey)
    if not g or g.get("status") != "done":
        req = {"model_id": MODEL, "prompt": PROMPTS[naam], "start_frame": {"type": "asset", "asset_id": a["asset_id"]},
               "resolution": "1080p", "duration_secs": 8, "generate_audio": False, "aspect_ratio": "9:16"}
        content, hdr = paid(led, gkey, "POST", "/v1/flows/video", body=req,
                            meta={"model": MODEL, "source_sha256": sha, "prompt": PROMPTS[naam], "settings": {k: v for k, v in req.items() if k != "prompt"}})
        resp = json.loads(content)
        gid = resp.get("generation_id") or resp.get("id")
        rid = hdr.get("request-id")
        g = led.update(gkey, lambda v: {**v, "status": "done", "generation_id": gid, "request_id": rid,
                                         "character_cost": hdr.get("character-cost"), "header_names": sorted(hdr), "response_keys": list(resp)})
        report("video", MODEL, rid or gid, {k: v for k, v in hdr.items() if k != "request-id" or v == (rid or gid)}, seconds=8)
    gid = g["generation_id"]
    # 3. pollen + downloaden
    while not uit.exists():
        content, _ = request("GET", f"/v1/flows/video/{gid}")
        st = json.loads(content)
        status = st.get("status")
        if status in ("completed", "succeeded", "complete"):
            url = st.get("content_url") or (st.get("output") or {}).get("content_url")
            tmp = uit.with_suffix(".part")
            subprocess.run(["curl", "-sS", "-f", "-o", str(tmp), url], check=True)
            tmp.rename(uit)
            led.update(gkey, lambda v: {**v, "final_status": st, "clip_sha256": hashlib.sha256(uit.read_bytes()).hexdigest()})
        elif status in ("failed", "error", "cancelled"):
            led.update(gkey, lambda v: {**v, "final_status": st})
            raise RuntimeError(f"{naam}: generatie mislukt: {json.dumps(st)[:400]}")
        else:
            time.sleep(15)
    v = probe(uit)
    print(naam, v)
    return naam, v


if __name__ == "__main__":
    jobs = [a.split("=", 1) for a in sys.argv[1:]]
    with ThreadPoolExecutor(3) as ex:
        for r in ex.map(lambda j: maak(*j), jobs):
            print("klaar", r)

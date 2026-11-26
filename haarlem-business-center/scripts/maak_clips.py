"""Image-to-video (ElevenLabs flows, veo-3.1-generate-001, 1080p, 9:16, 8 s) vanuit staande startbeelden
(bronnen/startbeelden/*.png, getrouwe uitsnede uit de WhatsApp-impressies in de Frame.io-bronnenbibliotheek).

Gebruik: python3 scripts/maak_clips.py naam [naam ...]
Elke betaalde POST staat eerst als 'pending' in bronnen/generaties.json en wordt nooit blind herhaald.
"""
import hashlib, json, subprocess, sys, time, uuid
from concurrent.futures import ThreadPoolExecutor
from el import Ledger, paid, request, report, ROOT

MODEL = "veo-3.1-generate-001"
TAIL = " Keep the architecture, walls, windows, furniture, materials, layout and proportions exactly as in the image; do not add or change any building elements. Realistic, natural light. One continuous shot, no cuts, no transitions, no morphing."
PROMPTS = {
    "kantoorunit-vergadertafel": "Modern office unit with a meeting table, glass partition and large windows with a city view. Very slow, smooth push-in towards the windows; a person in the background moves naturally." + TAIL,
    "design-studio-overleg": "Bright design studio where three people talk at a round table. Very slow, gentle push-in; the people talk and gesture naturally." + TAIL,
    "gebouw-aan-het-spaarne": "Large brick business building on the bank of the Spaarne river under a sunny sky. Very slow, smooth upward tilt; clouds drift slowly and the water ripples gently." + TAIL,
    "kantoor-entresol-werkplek": "Warm office with a desk and a woman working at a computer in late sunlight. Very slow, subtle lateral camera slide; the woman moves naturally while working." + TAIL,
    "binnenstraat-loopbrug": "Inner street between modern business units with an elevated walkway bridge and parking. Very slow, smooth forward dolly along the street; clouds drift slowly." + TAIL,
    "kantoorvloer-glazen-wanden": "Open office floor with glass-walled meeting rooms, desks and large windows. Very slow, smooth push-in; people in the background move naturally." + TAIL,
    "kantoorvloer-daglicht": "Bright open office with desks, plants and sunlight streaming through large windows. Very slow, smooth lateral slide; people move naturally at their desks." + TAIL,
    "kantoorvloer-donker-plafond": "Modern office floor with a dark ceiling, glass partitions and windows with a view. Very slow, smooth push-in; people in the background move naturally." + TAIL,
    "design-studio-gang": "Design studio interior with a geometric feature wall, plants and a bright window at the end. Very slow, smooth forward dolly towards the window." + TAIL,
}


def probe(p):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries",
                          "stream=width,height,sample_aspect_ratio,duration:stream_side_data=rotation", "-of", "json", str(p)],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)["streams"][0]


def maak(naam):
    led = Ledger()
    beeld = ROOT / f"bronnen/startbeelden/{naam}.png"
    sha = hashlib.sha256(beeld.read_bytes()).hexdigest()
    s = probe(beeld)
    assert (s["width"], s["height"]) == (1080, 1920), "startbeeld moet 1080x1920 zijn"
    uit = ROOT / f"public/clips/{naam}.mp4"
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
    gkey = f"video:{naam}:{sha}"
    g = led.get(gkey)
    if not g or g.get("status") != "done":
        req = {"model_id": MODEL, "prompt": PROMPTS[naam], "start_frame": {"type": "asset", "asset_id": a["asset_id"]},
               "resolution": "1080p", "duration_secs": 8, "generate_audio": False, "aspect_ratio": "9:16"}
        content, hdr = paid(led, gkey, "POST", "/v1/flows/video", body=req,
                            meta={"model": MODEL, "source_sha256": sha, "prompt": PROMPTS[naam],
                                  "settings": {k: v for k, v in req.items() if k != "prompt"}})
        resp = json.loads(content)
        gid = resp.get("generation_id") or resp.get("id")
        rid = hdr.get("request-id")
        g = led.update(gkey, lambda v: {**v, "status": "done", "generation_id": gid, "request_id": rid,
                                         "character_cost": hdr.get("character-cost"), "header_names": sorted(hdr), "response_keys": list(resp)})
        report("video", MODEL, rid or gid, {k: v for k, v in hdr.items() if k != "request-id" or v == (rid or gid)}, seconds=8)
    gid = g["generation_id"]
    while not uit.exists():
        content, _ = request("GET", f"/v1/flows/video/{gid}")
        st = json.loads(content)
        status = st.get("status")
        if status in ("completed", "succeeded", "complete"):
            url = st.get("content_url") or (st.get("output") or {}).get("content_url")
            tmp = uit.with_suffix(".part")
            subprocess.run(["curl", "-sS", "-f", "-o", str(tmp), url], check=True)
            tmp.rename(uit)
            led.update(gkey, lambda v: {**v, "final_status": {k: st.get(k) for k in st if "url" not in k},
                                         "clip_sha256": hashlib.sha256(uit.read_bytes()).hexdigest()})
        elif status in ("failed", "error", "cancelled"):
            led.update(gkey, lambda v: {**v, "final_status": st})
            raise RuntimeError(f"{naam}: generatie mislukt: {json.dumps(st)[:400]}")
        else:
            time.sleep(15)
    v = probe(uit)
    print(naam, v, flush=True)
    return naam, v


if __name__ == "__main__":
    with ThreadPoolExecutor(3) as ex:
        for r in ex.map(maak, sys.argv[1:] or list(PROMPTS)):
            print("klaar", r, flush=True)

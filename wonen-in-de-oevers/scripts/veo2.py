"""Veo 3.1 image-to-video via ElevenLabs (9:16, 1080p) for the tussenwoning start frames.
Usage: python3 -I veo2.py submit|poll <workdir>. Ledger never resubmits uncertain POSTs."""
import json, sys, subprocess, pathlib, fcntl
sys.path.insert(0, str(pathlib.Path(__file__).parent)); from b import bridge
W = pathlib.Path(sys.argv[2]); L = W / "veo-ledger.json"
TAIL = " One continuous shot, no cuts, no transitions, no morphing. Buildings, roofs, windows, materials, proportions and layout stay exactly as in the photo; nothing is added or removed."
NEG = "cuts, transitions, morphing, warping, distortion, flicker, changed architecture, new buildings, extra windows, text, logos, watermark, borders, letterbox, cartoon, fast camera movement"
SHOTS = {
 "TR1": "Very slow, smooth push-in towards the light gable facade of the terraced family house on a sunny afternoon, tree leaves swaying gently in the breeze, a parent with a cargo bike slowly cycling along the path.",
 "TR2": "Slow, steady lateral camera drift to the right along the row of terraced houses with their front doors and neat hedges, a flowering shrub moving softly in the breeze, people walking calmly.",
 "TR3": "",
 "TL1": "Slow upward camera tilt from the wildflowers and grass up to the light wooden gable of the terraced house, soft breeze in the flowers and tree branches, warm daylight.",
 "TL2": "Slow, gentle push-in across the water and pink wildflowers towards the row of terraced houses, small ripples on the water, ducks gliding slowly, flowers swaying.",
 "TL3": "Slow lateral camera drift to the left past the gable end of the terraced houses, willow branches swaying gently in the foreground, clouds drifting slowly.",
 "TU1": "Slow, smooth rising crane movement from the canal and wildflowers up towards the brick gable house and its terraced neighbours, gentle breeze, warm evening sunlight.",
 "TU2": "Slow camera glide along the canal with white swans gliding calmly on the water towards the terraced houses, reeds and wildflowers swaying, soft warm daylight.",
 "TI1": "Very slow, smooth push-in towards the cream sofa and wooden coffee table in the bright living room, soft natural daylight, a plant leaf moving very slightly.",
 "TI2": "Slow lateral camera drift through the dining area past the round table and chairs towards the window and kitchen, soft natural daylight, calm and still interior.",
}
SHOTS = {k: v for k, v in SHOTS.items() if v}
led = json.loads(L.read_text()) if L.exists() else {}
def save(): L.write_text(json.dumps(led, indent=1))
def hdrs(p):
    h = {}
    for l in p.read_text().splitlines():
        if ":" in l: h[l.split(":", 1)[0].strip().lower()] = l.split(":", 1)[1].strip()
    return h
def call(args, hdr=None):
    return subprocess.check_output(["curl", "-sS", "-m", "180"] + (["-D", str(hdr)] if hdr else []) + args)
lock = open(W / ".lock", "w"); fcntl.flock(lock, fcntl.LOCK_EX)
B = bridge()
if sys.argv[1] == "submit":
    only = sys.argv[3:] or list(SHOTS)
    for k in only:
        e = led.setdefault(k, {})
        if "generation_id" in e or e.get("submitting"): continue
        if "asset_id" not in e:
            r = json.loads(call(["-F", f"asset=@{W}/portrait/{k}.jpg;type=image/jpeg", "-F", f"name=oevers-tussenwoning-{k}-9x16", "https://api.elevenlabs.io/v1/assets"]))
            e["asset_id"] = r.get("asset_id") or r.get("id"); e["asset_resp"] = {x: y for x, y in r.items() if x != "content_url"}; save()
        prompt = SHOTS[k] + TAIL
        body = {"model_id": "veo-3.1-generate-001", "prompt": prompt, "negative_prompt": NEG,
                "start_frame": {"type": "asset", "asset_id": e["asset_id"]}, "resolution": "1080p",
                "duration_secs": 8, "generate_audio": False, "aspect_ratio": "9:16"}
        e["submitting"] = True; e["request"] = body; save()
        hp = W / f"{k}.hdr"
        r = json.loads(call(["-X", "POST", "-H", "Content-Type: application/json", "-d", json.dumps(body), "https://api.elevenlabs.io/v1/flows/video"], hp))
        h = hdrs(hp); hp.unlink()
        e["submit_resp"] = r; e["headers"] = {x: h.get(x) for x in ("request-id", "character-cost", "x-character-count")}
        if "id" in r:
            e["generation_id"] = r["id"]; e.pop("submitting"); save()
            rid = h.get("request-id") or r["id"]
            try:
                print(k, "usage", B.record_elevenlabs("video", "veo-3.1-generate-001", rid, headers=h if h.get("request-id") == rid else None, seconds=8))
            except Exception as ex: print(k, "usage err", ex)
        else: e.pop("submitting"); e["rejected"] = True
        save(); print(k, str(r)[:200], flush=True)
else:
    for k, e in led.items():
        if "generation_id" not in e or e.get("done"): continue
        r = json.loads(call([f"https://api.elevenlabs.io/v1/flows/video/{e['generation_id']}"]))
        e["status"] = r.get("status"); print(k, r.get("status"), r.get("failure_reason") or "", flush=True)
        if r.get("status") == "completed":
            subprocess.check_call(["curl", "-sS", "-m", "300", "-o", str(W / "clips" / f"{k}.mp4"), r["content_url"]])
            e["done"] = True; e["poll_resp"] = {x: y for x, y in r.items() if "url" not in x}
        save()

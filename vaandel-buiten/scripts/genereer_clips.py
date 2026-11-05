"""
Maakt per staande startfoto (source-assets/portrait/*.jpg, 1080x1920) een 8 s clip met ElevenLabs Image & Video
(veo-3.1-generate-001, 1080p, 9:16, zonder geluid). Authenticatie loopt via het netwerk (proxy-geinjecteerde xi-api-key),
er staat geen sleutel in deze repo.

Veiligheid tegen dubbel betalen: voor elke betaalde POST staat de status "submitting" in source-assets/generations.json;
een clip met status "submitting" zonder generation_id wordt NOOIT automatisch opnieuw ingediend.

Gebruik: python3 scripts/genereer_clips.py [naam ...]
"""
import json, subprocess, sys, threading, time, urllib.request, hashlib
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PORTRAIT = ROOT / "source-assets/portrait"
ORIG = ROOT / "source-assets/motion-original"
LEDGER = ROOT / "source-assets/generations.json"
HOOK = " Photorealistic architectural visualisation brought to life, faithful to the photo: the buildings, roofs, bricks, windows, proportions and layout stay exactly as in the start image. one continuous shot, no cuts, no transitions, no morphing."
NEG = "text, captions, subtitles, logos, watermark, new buildings, changed architecture, cartoon, distorted faces, extra limbs, warping, morphing, flicker, cuts, transitions"
CLIPS = {
    "gable_street": "Very slow gentle push-in towards the brick house with the steep gable on a sunny day, leaves and hedge flowers moving softly in the breeze, a resident quietly walks at the front door.",
    "gable_cars": "Slow gentle dolly to the right past the large gabled brick house, the neighbours sitting on the bench chat quietly, flowers sway in the light wind, soft sunshine and drifting clouds.",
    "corner_bike": "Slow gentle push-in on the gabled corner house, a cyclist rides slowly along the brick street, tree branches and flowers move softly in the breeze, clouds drift.",
    "garden_water": "Slow gentle drift forward along the water towards the back gardens with wooden decks, people relaxing on the terraces, reeds and wildflowers sway, light ripples on the water, sunny sky.",
    "kids_water": "Slow gentle camera glide to the right over the grass and ditch towards the row of brick houses, a child plays on the lawn, willow branches and wildflowers move in the breeze.",
    "house_water": "Slow gentle push-in over the water and wildflowers towards the white-and-brick row of houses, a duck paddles in the ditch, flowers sway softly, sunny clouds drift past.",
    "street_trees": "Slow gentle drift forward along the green verge towards the corner house, the slender tree and hedge move softly in the wind, a white car stands on the driveway, sunny sky.",
    "interior_kids": "Slow gentle push-in into the bright living room, the two children play with wooden blocks on the rug, the woman on the sofa softly scrolls on her tablet, warm daylight through the windows.",
    "interior_garden": "Slow gentle dolly forward through the living room towards the open garden door, the curtain moves in the breeze, the cat on the rug stretches slightly, warm daylight.",
    "interior_dining": "Slow gentle push-in towards the dining table and open kitchen of the bright living room, soft daylight through the windows, the plants and hanging lamps stir very slightly, calm peaceful atmosphere.",
    "interior_living": "Slow gentle glide forward through the bright living room past the sofa and armchair towards the windows, soft daylight, curtains and plant leaves move slightly, calm cosy atmosphere.",
    "interior_kitchen": "Slow gentle glide through the open living kitchen towards the large garden windows, soft daylight, a plant leaf stirs lightly, a person sits quietly at the dining table.",
}
lock = threading.Lock()


def load():
    return json.loads(LEDGER.read_text()) if LEDGER.exists() else {}


def save_entry(name, **kw):
    with lock:
        d = load()
        d.setdefault(name, {}).update(kw)
        LEDGER.write_text(json.dumps(d, indent=1))


def curl_json(args):
    r = subprocess.run(["curl", "-sS", "-D", "-"] + args, capture_output=True, text=True, check=True)
    head, _, body = r.stdout.rpartition("\n\n")
    headers = {}
    for line in head.splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            headers[k.strip().lower()] = v.strip()
    return json.loads(body), headers


def maak(name):
    d = load().get(name, {})
    foto = PORTRAIT / f"{name}.jpg"
    sha = hashlib.sha256(foto.read_bytes()).hexdigest()
    if not d.get("asset_id"):
        j, _ = curl_json(["-X", "POST", "https://api.elevenlabs.io/v1/assets", "-F", f"asset=@{foto};type=image/jpeg", "-F", f"name=vaandel-buiten-{name}-9x16"])
        save_entry(name, asset_id=j["asset_id"], source_portrait_sha256=sha)
        d = load()[name]
    if not d.get("generation_id"):
        if d.get("status") == "submitting":
            print(name, "ONZEKERE indiening, niet automatisch herhalen", flush=True)
            return
        save_entry(name, status="submitting", prompt=CLIPS[name] + HOOK)
        body = {"model_id": "veo-3.1-generate-001", "prompt": CLIPS[name] + HOOK, "negative_prompt": NEG,
                "start_frame": {"type": "asset", "asset_id": d["asset_id"]}, "resolution": "1080p", "duration_secs": 8,
                "generate_audio": False, "aspect_ratio": "9:16"}
        j, h = curl_json(["-X", "POST", "https://api.elevenlabs.io/v1/flows/video", "-H", "Content-Type: application/json", "-d", json.dumps(body)])
        if "id" not in j:
            save_entry(name, status="submit_failed", error=json.dumps(j)[:500])
            print(name, "indienen mislukt", str(j)[:300], flush=True)
            return
        save_entry(name, generation_id=j["id"], status="submitted", request_id=h.get("request-id", ""), submit_headers={k: v for k, v in h.items() if k in ("request-id", "character-cost")})
        print(name, "ingediend", j["id"], flush=True)
        d = load()[name]
    gid = d["generation_id"]
    for _ in range(120):
        j, h = curl_json(["https://api.elevenlabs.io/v1/flows/video/" + gid])
        if j.get("status") in ("completed", "failed"):
            break
        time.sleep(20)
    if j.get("status") != "completed":
        save_entry(name, status="failed", error=json.dumps({k: j.get(k) for k in ("status", "failure_reason", "error_message")}))
        print(name, "MISLUKT", j.get("failure_reason"), j.get("error_message"), flush=True)
        return
    ORIG.mkdir(parents=True, exist_ok=True)
    uit = ORIG / f"{name}.mp4"
    subprocess.run(["curl", "-sS", "-f", "-o", str(uit), j["content_url"]], check=True)  # geen credentials naar de contenthost
    save_entry(name, status="completed", file=str(uit.relative_to(ROOT)), result_keys=sorted(j.keys()), completed_meta={k: j.get(k) for k in j if k not in ("content_url",)})
    print(name, "klaar", flush=True)


if __name__ == "__main__":
    namen = sys.argv[1:] or [n for n in CLIPS if load().get(n, {}).get("status") != "completed"]
    with ThreadPoolExecutor(4) as p:
        list(p.map(maak, namen))

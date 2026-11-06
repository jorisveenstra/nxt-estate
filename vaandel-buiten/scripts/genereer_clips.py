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
HOOK = " Photorealistic architectural visualisation brought to life, faithful to the photo: the buildings, roofs, timber cladding, windows, proportions and layout stay exactly as in the start image. one continuous shot, no cuts, no transitions, no morphing."
NEG = "text, captions, subtitles, logos, watermark, new buildings, changed architecture, cartoon, distorted faces, extra limbs, warping, morphing, flicker, cuts, transitions"
CLIPS = {
    "aerial": "Slow gentle aerial drift forward over the small residential park and the canal towards the village, traffic moves quietly on the road, trees sway softly, warm evening sunlight.",
    "park_path": "Very slow gentle push-in towards the large timber-clad house with the steep dark roof, two residents chat quietly in front of the hedge, blossom branches and grass move softly in the breeze.",
    "blossom_path": "Slow gentle push-in along the brick path between the flower borders towards the gabled houses in the distance, blossom petals drift in the light breeze, small figures play on the green, clouds drift.",
    "wood_row": "Slow gentle dolly to the right along the row of dark timber houses, a woman walks slowly along the brick path, leaves of the tree sway softly, soft spring sunshine.",
    "gables_flowers": "Slow gentle glide to the right past the white flowers towards the two timber gabled houses, flowers and leaves move softly in the breeze, light clouds drift across the blue sky.",
    "cyclist_park": "Slow gentle push-in across the green park between the two trees, a cyclist rides slowly along the path in the distance, flowers in the foreground sway softly, calm evening light.",
    "bike_lane": "Slow gentle drift forward along the cycle path, a cyclist in a red top rides slowly towards the brick house, tree branches and grass move softly in the wind, sunny sky.",
    "row_path": "Slow gentle dolly forward along the brick path towards the timber-clad row of houses, a few residents walk slowly in the distance, spring leaves move softly in the breeze.",
    "dark_house": "Very slow gentle push-in towards the dark timber house with the steep gable, two residents sit quietly on the terrace behind the hedge, branches sway lightly in the wind, calm evening light.",
    "pond_woman": "Slow gentle camera glide to the right over the grass and the water's edge towards the houses, a woman in an orange dress stands still while a small child plays on the path, reeds and wild grass sway softly.",
    "veg_garden": "Slow gentle glide forward along the raised vegetable beds towards the timber gabled house, vegetable leaves and tree branches move softly in the breeze, warm daylight.",
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
        j, _ = curl_json(["-X", "POST", "https://api.elevenlabs.io/v1/assets", "-F", f"asset=@{foto};type=image/jpeg", "-F", f"name=vaandel-buiten-nieuw-{name}-9x16"])
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

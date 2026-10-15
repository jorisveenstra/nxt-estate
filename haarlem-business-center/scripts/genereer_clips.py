"""
Animeert elke foto (public/foto-jpg) tot een 8 s 1080p clip via ElevenLabs Image & Video (veo-3.1-generate-001).
Voortgang staat in scripts/clips-state.json (bron-hash, asset-id, generation-id). Een foto met een bekend
generation-id wordt NOOIT opnieuw gegenereerd; alleen gepolld/gedownload. Authenticatie: proxy-injectie / ELEVENLABS_API_KEY.
"""
import hashlib, json, os, subprocess, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATE = ROOT / "scripts/clips-state.json"
API = "https://api.elevenlabs.io/v1"
HDR = {"xi-api-key": os.environ["ELEVENLABS_API_KEY"]} if os.environ.get("ELEVENLABS_API_KEY") else {}

STIJL = ("Faithful architectural visualization. Preserve the building, proportions, materials, layout, signage and people exactly as in the image. "
         "Very subtle, slow, realistic camera movement (gentle push-in). Natural minor motion only (water ripples, leaves, small cars or people moving slowly). "
         "No cuts, no new objects, no morphing, calm and steady.")
PROMPTS = {
    "hbc-spaarne-kant.4": "Slow gentle dolly-in towards the brick building along the water; water ripples, swans drift slowly.",
    "hbc-waarderweg": "Slow gentle push-in along the street side of the brick building; a car and cyclist pass slowly, tree leaves sway.",
    "hbc-entree-close-up": "Slow gentle push-in towards the entrance; people walk slowly, a van is parked, lights glow.",
    "hbc-punt-orgineel": "Slow gentle drift towards the building point on the waterfront; water ripples, a sailboat drifts, grass sways.",
    "onder-het-dek": "Slow gentle push-in along the covered passage between the business units; a car moves slowly.",
    "punt-closeup": "Slow gentle drift over the waterfront building corner; sailboat drifts on the water, clouds move slightly.",
    "units-met-glazen-gevel-gecombineerd": "Slow gentle push-in towards the glass-fronted units; people and vehicles move subtly.",
    "units-standaard-met-glazen-overhead-deur": "Slow gentle push-in along the units with glass overhead doors; a white car and people move slowly.",
    "g33": "Slow gentle pan over the rooftop terrace with water view; people chat quietly, plants sway.",
    "h26.1": "Slow gentle push-in towards the covered entrance hall; cars and people move slowly.",
    "h26.10": "Slow gentle push-in on the business units across the parking area; a man walks slowly, cars parked.",
    "h26.2": "Slow gentle drift through the covered bicycle parking area; people move subtly, sunlight shifts.",
    "h7": "Slow gentle forward glide above the courtyard between the building wings; cars move very slowly, clouds drift.",
    "j19": "Slow gentle push-in on the lunchroom with large glass windows; guests move and talk quietly.",
    "j38.3": "Very slow gentle push-in on the brick facade with arched windows; warm window light flickers subtly.",
    "j38": "Very slow gentle push-in on the brick facade with arched windows; warm window light flickers subtly.",
}

def req(method, path, **kw):
    import requests
    r = requests.request(method, API + path, headers=HDR, timeout=300, **kw)
    return r

def load():
    return json.loads(STATE.read_text()) if STATE.exists() else {}

def save(s):
    STATE.write_text(json.dumps(s, indent=1))

def main(only=None):
    s = load()
    for jpg in sorted((ROOT / "public/foto-jpg").glob("*.jpg")):
        n = jpg.stem
        if only and n not in only: continue
        e = s.setdefault(n, {})
        e["sha256_jpg"] = hashlib.sha256(jpg.read_bytes()).hexdigest()
        e["sha256_png"] = hashlib.sha256((ROOT / f"public/foto/{n}.png").read_bytes()).hexdigest()
        if e.get("clip") and (ROOT / e["clip"]).exists(): continue
        if "generation_id" not in e:
            if "asset_id" not in e:
                r = req("POST", "/assets", files={"asset": (jpg.name, jpg.read_bytes(), "image/jpeg")}, data={"name": n})
                r.raise_for_status(); e["asset_id"] = r.json()["asset_id"]; save(s)
            body = {"model_id": "veo-3.1-generate-001", "prompt": PROMPTS[n] + " " + STIJL, "start_frame": {"type": "asset", "asset_id": e["asset_id"]},
                    "resolution": "1080p", "duration_secs": 8, "generate_audio": False, "aspect_ratio": "16:9"}
            e["requested"] = True; save(s)  # markeer vóór de betaalde call
            r = req("POST", "/flows/video", json=body)
            if r.status_code >= 300:
                print(n, "POST mislukt", r.status_code, r.text[:300]); e["error"] = r.text[:300]; save(s); continue
            e["generation_id"] = r.json().get("generation_id") or r.json().get("id"); e["post_response_keys"] = list(r.json().keys()); save(s)
            print(n, "gestart", e["generation_id"])
    # poll
    while True:
        open_ = [n for n, e in s.items() if e.get("generation_id") and not e.get("clip") and (not only or n in only)]
        if not open_: break
        for n in open_:
            e = s[n]
            r = req("GET", f"/flows/video/{e['generation_id']}"); j = r.json()
            st = j.get("status")
            if st == "completed":
                out = ROOT / f"public/clips/{n}.mp4"
                urllib.request.urlretrieve(j["content_url"], out)
                e["clip"] = f"public/clips/{n}.mp4"; save(s); print(n, "klaar")
            elif st == "failed":
                e["error"] = json.dumps(j)[:300]; e["generation_id_failed"] = e.pop("generation_id"); save(s); print(n, "FAILED", e["error"])
            else:
                e["status"] = st
        save(s); time.sleep(15)

if __name__ == "__main__":
    main(sys.argv[1:] or None)

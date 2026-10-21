"""
Animeert de staande startframes (public/bron/*.png, 1080x1920, subject-bewuste crops van de aangeleverde foto's)
tot echte bewegende beelden met ElevenLabs Image & Video (veo-3.1-generate-001, 9:16, 1080p, 8 s, zonder geluid).

Elke generatie wordt direct in scripts/generaties.json vastgelegd (onder een lock) voordat er gepold wordt;
een bestaande generatie-ID wordt altijd hervat en nooit opnieuw betaald.
Uitvoer: ai-broll/<naam>.mp4 (origineel van de provider) en public/clips/<naam>.mp4 (30 fps, gecontroleerd 1080x1920)
Authenticatie: via de omgeving (netwerkproxy); er staat geen sleutel in de repo.
"""
import json, subprocess, sys, threading, time, urllib.request, uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "scripts/generaties.json"
LOCK = threading.Lock()
BASIS = "https://api.elevenlabs.io/v1"
STIJL = ("one continuous shot, no cuts, no transitions, no morphing. Photorealistic, natural light, faithful to the photo: "
         "keep the buildings, proportions, materials, windows and layout exactly as in the start frame, no new objects, no text. ")
NEGATIEF = "text, captions, logos, watermark, people appearing, cuts, transitions, morphing, warping buildings, flicker, cartoon"

PROMPTS = {
    "h1-appartement-woonkamer": "Slow gentle camera glide forward through the bright apartment living room towards the balcony doors, soft daylight, curtain barely moving.",
    "h2-appartement-eetkamer": "Slow smooth dolly forward through the open-plan living and dining room, warm daylight from the large windows, calm interior movement only.",
    "h3-wijk-zeeland": "Slow cinematic drone drift forward over the green Dutch residential neighbourhood with trees and houses, soft summer light, leaves moving gently.",
    "h4-park-toren": "Slow upward camera tilt along the tower in the green park, tree leaves swaying gently in the breeze, soft sunlight, clouds drifting.",
    "h5-dijk-water": "Slow gentle push-in towards the buildings along the water, calm ripples on the water surface, soft evening light, birds far away.",
    "b1-zonsondergang": "Slow cinematic drone drift forward over the waterfront at sunset, glowing pink sky, calm water of the Westerschelde, soft golden light.",
    "b2-balkon": "Slow subtle push-in over the balcony table towards the open sea view, light sea breeze, soft clouds drifting, gentle steam from the cups.",
    "b3-kust": "Slow cinematic aerial drift over the Zeeland coast, tidal flats and dike, gentle light changes, clouds moving slowly across the sky.",
    "b4-keuken": "Slow smooth camera glide through the bright open kitchen and living area, warm daylight from the windows, calm interior movement only.",
    "b5-luchtfoto": "Slow cinematic drone orbit a little to the right around the buildings by the Westerschelde, clear daylight, calm water in the distance.",
}


def api(method, pad, body=None, raw=None, ctype="application/json"):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    req = urllib.request.Request(BASIS + pad, data=data, method=method, headers={"Content-Type": ctype} if data else {})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.loads(r.read())


def ledger():
    return json.loads(LEDGER.read_text()) if LEDGER.exists() else {}


def zet(naam, **kw):
    with LOCK:
        d = ledger()
        d.setdefault(naam, {}).update(kw)
        LEDGER.write_text(json.dumps(d, indent=1))


def upload_asset(pad, naam):
    grens = uuid.uuid4().hex
    deel = lambda k, v: f'--{grens}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    body = deel("name", "pattistpark-" + naam)
    body += (f'--{grens}\r\nContent-Disposition: form-data; name="asset"; filename="{naam}.png"\r\nContent-Type: image/png\r\n\r\n').encode()
    body += Path(pad).read_bytes() + f"\r\n--{grens}--\r\n".encode()
    return api("POST", "/assets", raw=body, ctype=f"multipart/form-data; boundary={grens}")


def maak(naam):
    d = ledger().get(naam, {})
    uit = ROOT / "ai-broll" / f"{naam}.mp4"
    if not uit.exists():
        if "generation_id" not in d:
            if "asset_id" not in d:
                a = upload_asset(ROOT / "public/bron" / f"{naam}.png", naam)
                zet(naam, asset_id=a.get("asset_id") or a.get("id"))
                d = ledger()[naam]
            gen = api("POST", "/flows/video", {
                "model_id": "veo-3.1-generate-001", "prompt": STIJL + PROMPTS[naam], "negative_prompt": NEGATIEF,
                "start_frame": {"type": "asset", "asset_id": d["asset_id"]},
                "aspect_ratio": "9:16", "duration_secs": 8, "resolution": "1080p", "generate_audio": False})
            zet(naam, generation_id=gen["id"], ingediend=time.time())
            d = ledger()[naam]
            print(naam, "ingediend", flush=True)
        wacht = 20
        for _ in range(90):
            time.sleep(wacht)
            r = api("GET", f"/flows/video/{d['generation_id']}")
            if r["status"] in ("completed", "failed"):
                break
            wacht = min(45, wacht * 1.2)
        if r["status"] != "completed":
            zet(naam, status="mislukt", fout=str(r.get("failure_reason") or r.get("error_message")))
            print(naam, "MISLUKT", r, flush=True)
            return
        (ROOT / "ai-broll").mkdir(exist_ok=True)
        uit.write_bytes(urllib.request.urlopen(r["content_url"], timeout=300).read())  # zonder inloggegevens
        zet(naam, status="klaar")
    g = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,sample_aspect_ratio:stream_side_data=rotation", "-of", "json", str(uit)])
    zet(naam, geometrie=json.loads(g)["streams"][0])
    print(naam, g.decode().replace("\n", " "), flush=True)


if __name__ == "__main__":
    (ROOT / "public/clips").mkdir(parents=True, exist_ok=True)
    namen = sys.argv[1:] or list(PROMPTS)
    with ThreadPoolExecutor(4) as pool:
        list(pool.map(maak, namen))

"""
Maakt van projectfoto's (alleen baraca_village-bronnen) echte bewegende beelden via ElevenLabs
Image & Video, model veo-3.1-generate-001, native 1080p, staand 9:16, 8 s, zonder geluid.

Invoer: media/portret/<naam>.png (getrouwe staande uitsnede 1080x1920 van media/bronnen/).
Uitvoer: media/beweging/<naam>.mp4 (origineel van de provider) + media/beweging/generaties.json
(generatie-ID, bron-SHA256). Een generatie wordt nooit blind opnieuw ingediend: staat er al een
ID in generaties.json, dan wordt alleen die gepold/gedownload.

Gebruik: python3 scripts/genereer_beweging.py
"""
import hashlib
import json
import subprocess
import sys
import time
import urllib.request
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from threading import Lock

sys.path.insert(0, str(Path(__file__).resolve().parent))
from el import ROOT, bon, request  # noqa: E402

MODEL = "veo-3.1-generate-001"
VAST = ("one continuous shot, no cuts, no transitions, no morphing. Keep the architecture, proportions, "
        "materials, openings and layout exactly as in the start image; do not add or change buildings. "
        "Photorealistic, natural light, no text, no people appearing, no camera shake.")

CLIPS = {
    "Baraca Village - Villastraat met entree - portret startbeeld - gouden uur - 9x16": (
        "Baraca Village - Villastraat - rustige push-in langs de villa's - gouden uur - 9x16",
        "Slow, smooth gimbal push-in along the paved village street between the villas at golden hour, "
        "palm leaves and tropical plants moving gently in a light breeze, warm sunlight on the facades."),
    "Baraca Village - Speeltuin met waterspeelplek - portret startbeeld - gouden uur - 9x16": (
        "Baraca Village - Speeltuin en waterspeelplek - langzame tilt omhoog - gouden uur - 9x16",
        "Slow gentle camera tilt up from the small splash fountains in the water play area to the wooden "
        "play tower and slide, water bubbling softly, palm leaves swaying in a light breeze, golden hour light."),
    "Baraca Village - Badkamer met dubbele wastafel - portret startbeeld - warm interieurlicht - 9x16": (
        "Baraca Village - Badkamer met dubbele wastafel - subtiele push-in - warm interieurlicht - 9x16",
        "Very slow, subtle dolly push-in towards the double washbasin and backlit mirror of the villa bathroom, "
        "soft warm interior light, leaves outside the small window moving gently in the breeze."),
}

LOCK = Lock()
LOG = ROOT / "media/beweging/generaties.json"


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def log_lees():
    return json.loads(LOG.read_text()) if LOG.exists() else {}


def log_zet(naam, **kv):
    with LOCK:
        d = log_lees()
        d.setdefault(naam, {}).update(kv)
        LOG.write_text(json.dumps(d, indent=1, ensure_ascii=False))


def upload_asset(png, naam):
    grens = uuid.uuid4().hex
    data = (f"--{grens}\r\nContent-Disposition: form-data; name=\"name\"\r\n\r\n{naam}\r\n"
            f"--{grens}\r\nContent-Disposition: form-data; name=\"asset\"; filename=\"start.png\"\r\n"
            f"Content-Type: image/png\r\n\r\n").encode() + png.read_bytes() + f"\r\n--{grens}--\r\n".encode()
    status, h, raw = request("POST", "/v1/assets", data=data, content_type=f"multipart/form-data; boundary={grens}")
    if status not in (200, 201):
        raise SystemExit(f"asset-upload {naam}: {status} {raw[:300]!r}")
    d = json.loads(raw)
    return d.get("asset_id") or d.get("id")


def maak(start_naam):
    titel, beweging = CLIPS[start_naam]
    png = ROOT / "media/portret" / f"{start_naam}.png"
    uit = ROOT / "media/beweging" / f"{titel}.mp4"
    info = log_lees().get(titel, {})
    if uit.exists():
        return titel
    if not info.get("generation_id"):
        if info.get("submitting"):
            raise SystemExit(f"{titel}: eerdere indiening onzeker; controleer handmatig (geen blinde herhaling)")
        asset = info.get("asset_id") or upload_asset(png, start_naam)
        log_zet(titel, asset_id=asset, start_frame=png.name, start_sha256=sha(png), submitting=True)
        body = {"model_id": MODEL, "prompt": beweging + " " + VAST,
                "start_frame": {"type": "asset", "asset_id": asset}, "resolution": "1080p",
                "duration_secs": 8, "generate_audio": False, "aspect_ratio": "9:16"}
        status, h, raw = request("POST", "/v1/flows/video", body)
        bon(f"video-{start_naam[:40]}", "video", MODEL, h, status=status, seconds=8)
        if status not in (200, 201, 202):
            log_zet(titel, submitting=False, error=f"{status}")
            raise SystemExit(f"{titel}: video-indiening fout {status}: {raw[:300]!r}")
        gen = json.loads(raw)
        log_zet(titel, generation_id=gen["id"], request_id=h.get("request-id"), submitting=False,
                prompt=body["prompt"], settings={k: v for k, v in body.items() if k not in ("prompt", "start_frame")})
        print(titel, "ingediend", gen["id"], flush=True)
    gid = log_lees()[titel]["generation_id"]
    wacht = 20
    for _ in range(120):
        status, h, raw = request("GET", f"/v1/flows/video/{gid}")
        r = json.loads(raw) if status == 200 else {}
        if r.get("status") in ("completed", "failed"):
            break
        time.sleep(wacht)
        wacht = min(45, wacht * 1.2)
    if r.get("status") != "completed":
        log_zet(titel, status=r.get("status"), failure=str(r.get("failure_reason") or r.get("error_message")))
        raise SystemExit(f"{titel}: generatie mislukt: {r.get('failure_reason')} {r.get('error_message')}")
    url = r["content_url"]
    if url.startswith("/"):
        status, h, raw = request("GET", url)
        uit.write_bytes(raw)
    else:  # externe opslag: geen provider- of portalgegevens meesturen
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "video-ads/1.0"}), timeout=600) as resp:
            uit.write_bytes(resp.read())
    log_zet(titel, status="completed", clip_sha256=sha(uit), provider_response={k: v for k, v in r.items() if k != "content_url"})
    print(titel, "klaar", flush=True)
    return titel


def main():
    (ROOT / "media/beweging").mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(3) as pool:
        for t in pool.map(maak, CLIPS):
            p = ROOT / "media/beweging" / f"{t}.mp4"
            print(t, subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                     "stream=width,height,sample_aspect_ratio:format=duration", "-of", "csv=p=0", str(p)],
                                    capture_output=True, text=True).stdout.split())


if __name__ == "__main__":
    main()

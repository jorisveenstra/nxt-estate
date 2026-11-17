"""
Genereert de bewegende beelden voor Westeinde 41 via ElevenLabs Image & Video (Veo 3.1, 1080p, staand 9:16, 8 s, zonder geluid).

1. Beeld-naar-video: elke staande uitsnede in bron/staand/ (1080x1920, gesneden uit de originele renders in
   bron/origineel/, architectuur ongewijzigd) wordt als startframe geüpload en geanimeerd met subtiele camerabeweging.
2. Tekst-naar-video: sfeerbeelden van de omgeving (polder, vaarwater, dorp) en leefstijl, zonder het huis zelf.

Elke aanvraag wordt vóór verzending vastgelegd in bron/generaties.json; een aanvraag met onzekere uitkomst
wordt nooit automatisch herhaald. Origineel: ai-clips/<naam>.mp4, tijdlijnversie: public/clips/<naam>.mp4.

Gebruik: python3 scripts/genereer_beelden.py [naam ...]
"""
import hashlib
import json
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import el  # noqa

ROOT = el.ROOT
MODEL = "veo-3.1-generate-001"
VAST = "One continuous shot, no cuts, no transitions, no morphing. "
TROUW = ("Keep the building, its proportions, brickwork, roof tiles, dormers, window frames, materials and layout exactly "
         "as in the image; do not add, remove or change any architecture. Photorealistic, natural light. ")
NEGATIEF = ("cuts, transitions, morphing, warping, changing architecture, extra windows, extra buildings, text, captions, "
            "logos, watermark, borders, letterbox, cartoon, flicker, distorted faces")

BEELD = {
    "voorgevel-voordeur": "Very slow, smooth gimbal push-in towards the front door of this new brick house, leaves gently moving in the breeze, soft sunny afternoon light.",
    "voorgevel-rechts": "Slow, smooth lateral dolly to the left along the front facade, the woman gently pets the dog, leaves moving softly, sunny afternoon.",
    "achtergevel-terras": "Slow, smooth push-in towards the garden terrace at golden hour, the people on the terrace move naturally and talk, plants sway gently, warm evening light.",
    "achtergevel-boot": "Slow, smooth lateral dolly along the water, gentle ripples on the canal, the boat bobs softly at the jetty, ducks swim, warm golden-hour light.",
    "keuken-kookeiland": "Very slow, subtle push-in of only a few centimetres past the kitchen island towards the garden doors, sunlight shifts subtly, plants move gently outside.",
    "woonkamer-ramen": "Slow, smooth push-in through the living room towards the tall windows, curtains move softly in a light breeze, warm daylight.",
    "woonkamer-kast": "Slow, smooth arc to the right through the living room, the gold pendant light glints softly, warm daylight.",
}

STIJL = ("Photorealistic documentary footage shot on a full-frame cinema camera, natural light, realistic materials, "
         "subtle gimbal movement, vertical 9:16 framing, Noord-Holland, the Netherlands. ")
OMGEVING = {
    "polder-weiland": "Slow aerial drone shot over a flat green Dutch polder landscape with grazing black-and-white cows, straight drainage ditches reflecting the sky and a wide open horizon, soft morning light, light clouds.",
    "polder-sloot-riet": "Low slow gimbal shot along a still Dutch polder ditch lined with reeds, a heron standing in the water, green meadows beyond, early morning light with light mist.",
    "vaarwater-sloep": "A small wooden electric sloop boat with a couple in their sixties glides slowly along a quiet Dutch village waterway lined with reeds and willow trees, warm golden evening light, gentle ripples.",
    "boot-aanmeren": "Close-up of a man's hands tying the mooring line of a small wooden sloop to a cleat on a wooden garden jetty at the water's edge, calm water, warm late afternoon light.",
    "dorpsstraat": "Slow gimbal shot along a quiet historic Dutch village street in Noord-Holland with traditional brick houses with white window frames, a cyclist passing, a church spire in the distance, sunny morning.",
    "bakker": "Inside a small traditional Dutch village bakery, a smiling baker hands a paper bag with fresh bread over the counter to a customer, shelves with fresh loaves, warm morning light.",
    "vrijdagmarkt": "A small weekly outdoor market on a Dutch village square, stalls with fresh vegetables, flowers and Dutch cheese, local people shopping and chatting, sunny late morning, slow gimbal shot.",
    "thuiswerken": "A woman in her forties works on a laptop at a tidy wooden desk in a calm home office, she looks up and smiles at the view of green meadows through the window, soft daylight.",
    "gezin-eettafel": "A Dutch family with two children shares dinner at a large wooden dining table, passing a bowl of salad and laughing, warm evening light, close and natural, slow push-in.",
    "zolder-speelkamer": "Two children play with building blocks on a soft rug in a bright attic playroom with sloped wooden ceiling and a roof window, sunlight falling in, warm and calm.",
    "stel-koffie-water": "A retired Dutch couple in their sixties drinks coffee on a garden terrace at the water's edge, the woman points at ducks on the water, relaxed and smiling, soft morning light.",
    "fietsers-dijk": "Two cyclists ride along a narrow dyke road through the flat green Dutch polder, wide sky with white clouds, slow aerial tracking shot, sunny afternoon.",
}


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def probe(p):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,sample_aspect_ratio:stream_side_data=rotation:format=duration",
                          "-of", "json", str(p)], capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    s = d["streams"][0]
    return s["width"], s["height"], s.get("sample_aspect_ratio", "1:1"), float(d["format"]["duration"]), s.get("side_data_list", [])


def upload_asset(naam, pad):
    key = f"asset:{naam}"
    e = el.get_entry(key) or {}
    digest = sha(pad)
    if e.get("asset_id") and e.get("sha256") == digest:
        return e["asset_id"]
    if e.get("status") == "submitting":
        raise RuntimeError(f"{key}: eerdere upload met onzekere uitkomst; handmatig controleren")
    el.set_entry(key, status="submitting", sha256=digest, at=el.now())
    body, ct = el.multipart({"name": f"westeinde41-{naam}"}, {"asset": (f"{naam}.jpg", "image/jpeg", Path(pad).read_bytes())})
    st, h, data = el.request("POST", "/v1/assets", data=body, content_type=ct, timeout=180)
    if st >= 300:
        el.set_entry(key, status="failed", http=st, error=data[:300].decode(errors="replace"))
        raise RuntimeError(f"{key}: asset-upload {st}: {data[:300]!r}")
    r = json.loads(data)
    aid = r.get("asset_id") or r.get("id") or (r.get("asset") or {}).get("id")
    el.set_entry(key, status="done", asset_id=aid, response_keys=sorted(r.keys()))
    return aid


def submit(naam, body, extra):
    key = f"video:{naam}"
    e = el.get_entry(key) or {}
    if e.get("generation_id"):
        return e["generation_id"]
    if e.get("status") == "submitting":
        raise RuntimeError(f"{key}: eerdere aanvraag met onzekere uitkomst; niet blind herhalen")
    el.set_entry(key, status="submitting", at=el.now(), model=MODEL, prompt=body["prompt"], **extra)
    st, h, data = el.request("POST", "/v1/flows/video", body=body, timeout=180)
    if st >= 300:
        # Een duidelijke weigering (4xx) is geen onzekere uitkomst.
        el.set_entry(key, status="rejected", http=st, error=data[:400].decode(errors="replace"))
        raise RuntimeError(f"{key}: {st} {data[:400]!r}")
    r = json.loads(data)
    gid = r.get("id") or r.get("generation_id")
    rid = {k.lower(): v for k, v in h.items()}.get("request-id")
    el.set_entry(key, status="submitted", generation_id=gid, request_id=rid)
    el.record("video", MODEL, rid or gid, h if rid else {}, seconds=body["duration_secs"])
    return gid


def wacht(naam, gid):
    w = 20
    for _ in range(90):
        time.sleep(w)
        st, h, data = el.request("GET", f"/v1/flows/video/{gid}", timeout=60)
        if st >= 300:
            continue
        r = json.loads(data)
        if r.get("status") in ("completed", "failed"):
            return r
        w = min(45, w * 1.3)
    raise RuntimeError(f"{naam}: time-out bij wachten")


def maak(naam):
    origineel = ROOT / "ai-clips" / f"{naam}.mp4"
    tijdlijn = ROOT / "public/clips" / f"{naam}.mp4"
    if not origineel.exists():
        if naam in BEELD:
            start = ROOT / "bron/staand" / f"{naam}.jpg"
            aid = upload_asset(naam, start)
            body = {"model_id": MODEL, "prompt": VAST + TROUW + BEELD[naam], "negative_prompt": NEGATIEF,
                    "start_frame": {"type": "asset", "asset_id": aid}, "resolution": "1080p",
                    "duration_secs": 8, "generate_audio": False, "aspect_ratio": "9:16"}
            extra = {"type": "image_to_video", "start_frame": f"bron/staand/{naam}.jpg", "start_frame_sha256": sha(start)}
        else:
            body = {"model_id": MODEL, "prompt": VAST + STIJL + OMGEVING[naam], "negative_prompt": NEGATIEF,
                    "resolution": "1080p", "duration_secs": 8, "generate_audio": False, "aspect_ratio": "9:16"}
            extra = {"type": "text_to_video"}
        gid = submit(naam, body, extra)
        print(naam, "ingediend", gid, flush=True)
        r = wacht(naam, gid)
        if r["status"] != "completed":
            el.set_entry(f"video:{naam}", status="failed", failure=str(r.get("failure_reason") or r.get("error_message"))[:300])
            print(naam, "MISLUKT", r.get("failure_reason"), r.get("error_message"), flush=True)
            return
        el.download(r["content_url"], origineel)
        el.set_entry(f"video:{naam}", status="completed", file=f"ai-clips/{naam}.mp4", sha256=sha(origineel),
                     response_keys=sorted(r.keys()))
    w, h, sar, dur, side = probe(origineel)
    ok = w == 1080 and h == 1920 and sar in ("1:1", "N/A") and not any(s.get("rotation") for s in side)
    el.set_entry(f"video:{naam}", geometry=f"{w}x{h}", sar=sar, duration=dur, portrait_ok=ok)
    if not ok:
        print(naam, f"AFGEKEURD: {w}x{h} sar {sar}", flush=True)
        return
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(origineel), "-vf", "fps=30,format=yuv420p,setsar=1",
                    "-an", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-g", "30", "-movflags", "+faststart", str(tijdlijn)], check=True)
    print(naam, f"klaar {w}x{h} {dur:.1f}s", flush=True)


def main():
    (ROOT / "ai-clips").mkdir(exist_ok=True)
    (ROOT / "public/clips").mkdir(parents=True, exist_ok=True)
    alle = list(BEELD) + list(OMGEVING)
    namen = sys.argv[1:] or [n for n in alle if not (ROOT / "public/clips" / f"{n}.mp4").exists()]
    with ThreadPoolExecutor(6) as pool:
        for f in [pool.submit(maak, n) for n in namen]:
            try:
                f.result()
            except Exception as e:
                print("FOUT", e, flush=True)


if __name__ == "__main__":
    main()

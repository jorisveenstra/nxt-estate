"""
Animeert de portretuitsneden (bron/portret/*.jpg) tot echte bewegende clips via ElevenLabs Image & Video,
model veo-3.1-generate-001, 1080p, 9:16, 8 s, zonder audio.

Grootboek: scripts/ai-ledger.json (asset-id, generation-id, status, request-ids). Elke betaalde POST wordt
eerst als "posting" vastgelegd; staat er al een generation-id of een onzekere "posting", dan wordt NIET
opnieuw betaald maar alleen gepold / gestopt voor handmatige controle.
Clips: public/clips/<slug>.mp4 (gecontroleerd: 1080x1920, SAR 1:1, geen rotatie).
Authenticatie: netwerk-proxy injecteert xi-api-key (of ELEVENLABS_API_KEY in de omgeving).
Gebruik: python3 scripts/ai_video.py [slug ...]
"""
import json, os, subprocess, sys, threading, time, uuid, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "scripts/ai-ledger.json"
LOCK = threading.Lock()
API = "https://api.elevenlabs.io"
MODEL = "veo-3.1-generate-001"
SUFFIX = ("Keep the building, architecture, materials, proportions, windows and layout exactly as in the image. "
          "Photorealistic, subtle realistic camera movement only. One continuous shot, no cuts, no transitions, no morphing.")
PROMPTS = {
    "voorgevel-park": "Slow gentle push-in towards the brick townhouse facade at golden hour; leaves move softly in the breeze.",
    "achtergevel-terras": "Slow upward crane drift along the brick facade with the sunny first-floor terrace; people relax at the table, plants sway gently.",
    "achtergevel-straat": "Slow lateral dolly along the brick townhouse row at warm evening light; trees sway slightly.",
    "stadstuin": "Slow push-in into the lush city garden at sunrise; mother and child relax on the lounge sofa, soft light flickers through the leaves.",
    "woonkamer": "Slow smooth dolly forward through the high, light living room with the green sofa; daylight through the large windows.",
    "keuken": "Slow gentle push-in towards the dining table and the large window with park view; soft daylight, curtains move slightly.",
    "loft-studio": "Slow lateral dolly through the bright ground-floor loft studio with large garden windows; plants move softly.",
    "slaapkamer": "Slow gentle push-in towards the warm bedroom with freestanding bath; soft evening lamp light.",
    "park-vijver": "Slow gentle forward glide over the calm park pond; trees sway, water ripples with lily pads.",
    "park-wandelpad": "Static camera with very slight drift; the woman walks her small dog along the park path under tall trees.",
    "park-wandelaars": "Slow gentle follow shot; the couple walks their dog along the curving park path, trees sway in the breeze.",
}


def headers(extra=None):
    h = dict(extra or {})
    if os.environ.get("ELEVENLABS_API_KEY"):
        h["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
    return h


def call(method, path, data=None, hdr=None, timeout=120):
    req = urllib.request.Request(API + path, data=data, headers=headers(hdr), method=method)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        rh = {k.lower(): v for k, v in r.headers.items()}
        return json.loads(r.read() or b"{}"), {k: v for k, v in rh.items() if k in ("request-id", "character-cost", "x-request-id", "history-item-id") or k.startswith("x-character") or "cost" in k or "credit" in k}


def ledger_update(slug, **kv):
    with LOCK:
        d = json.loads(LEDGER.read_text()) if LEDGER.exists() else {}
        d.setdefault(slug, {}).update(kv)
        LEDGER.write_text(json.dumps(d, indent=1))
        return d[slug]


def ledger_get(slug):
    with LOCK:
        return (json.loads(LEDGER.read_text()) if LEDGER.exists() else {}).get(slug, {})


def probe(p):
    s = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_streams", "-show_format", "-of", "json", str(p)],
                                  capture_output=True, text=True, check=True).stdout)
    v = s["streams"][0]
    rot = any(float(sd.get("rotation", 0)) for sd in v.get("side_data_list", [])) or float(v.get("tags", {}).get("rotate", 0))
    return v["width"], v["height"], v.get("sample_aspect_ratio", "1:1"), rot, float(s["format"]["duration"])


def upload_asset(slug):
    e = ledger_get(slug)
    if e.get("asset_id"):
        return e["asset_id"]
    img = (ROOT / f"bron/portret/{slug}.jpg").read_bytes()
    b = "----nxt" + uuid.uuid4().hex
    body = (f"--{b}\r\nContent-Disposition: form-data; name=\"name\"\r\n\r\nParkvillas Purmerend {slug} 9x16\r\n"
            f"--{b}\r\nContent-Disposition: form-data; name=\"asset\"; filename=\"{slug}.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n").encode() + img + f"\r\n--{b}--\r\n".encode()
    res, rh = call("POST", "/v1/assets", body, {"Content-Type": f"multipart/form-data; boundary={b}"})
    aid = res.get("asset_id") or res.get("id")
    if not aid:
        raise RuntimeError(f"{slug}: geen asset-id in antwoord: {list(res)}")
    ledger_update(slug, asset_id=aid, asset_request=rh)
    return aid


def generate(slug):
    out = ROOT / f"public/clips/{slug}.mp4"
    e = ledger_get(slug)
    if out.exists() and e.get("status") == "verified":
        return slug, "cached"
    if e.get("state") == "posting" and not e.get("generation_id"):
        return slug, "ONZEKER: eerdere POST zonder generation-id, handmatig controleren"
    if not e.get("generation_id"):
        aid = upload_asset(slug)
        payload = {"model_id": MODEL, "prompt": PROMPTS[slug] + " " + SUFFIX,
                   "start_frame": {"type": "asset", "asset_id": aid}, "resolution": "1080p",
                   "duration_secs": 8, "generate_audio": False, "aspect_ratio": "9:16"}
        ledger_update(slug, state="posting", payload=payload)
        res, rh = call("POST", "/v1/flows/video", json.dumps(payload).encode(), {"Content-Type": "application/json"}, timeout=180)
        gid = res.get("generation_id") or res.get("id")
        ledger_update(slug, state="posted", generation_id=gid, post_request=rh, post_response_keys=list(res))
        if not gid:
            return slug, f"geen generation-id: {res}"
    gid = ledger_get(slug)["generation_id"]
    for _ in range(240):
        res, rh = call("GET", f"/v1/flows/video/{gid}")
        st = res.get("status")
        if st in ("completed", "complete", "succeeded"):
            break
        if st in ("failed", "error", "cancelled"):
            ledger_update(slug, status="failed", provider=res)
            return slug, f"mislukt: {res}"
        time.sleep(10)
    else:
        return slug, "time-out bij pollen"
    ledger_update(slug, provider_result={k: v for k, v in res.items() if "url" not in k.lower()})
    url = res.get("content_url") or res.get("video_url") or (res.get("output") or {}).get("content_url")
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(".tmp.mp4")
    subprocess.run(["curl", "-sS", "-f", "-L", "-o", str(tmp), url], check=True)  # geen credentials naar de content-host
    w, h, sar, rot, dur = probe(tmp)
    ok = w == 1080 and h == 1920 and sar in ("1:1", "N/A") and not rot
    ledger_update(slug, download={"width": w, "height": h, "sar": sar, "rotation": bool(rot), "duration": dur})
    if not ok:
        tmp.rename(out.with_suffix(".afgekeurd.mp4"))
        ledger_update(slug, status="rejected-geometry")
        return slug, f"AFGEKEURD {w}x{h} sar={sar} rot={rot}"
    tmp.rename(out)
    ledger_update(slug, status="verified")
    return slug, f"ok {w}x{h} {dur:.1f}s"


if __name__ == "__main__":
    slugs = sys.argv[1:] or list(PROMPTS)
    def safe(s):
        try:
            return generate(s)
        except urllib.error.HTTPError as e:
            detail = e.read(2000).decode(errors="replace")
            st = ledger_get(s)
            if st.get("state") == "posting" and not st.get("generation_id") and 400 <= e.code < 500:
                ledger_update(s, state="rejected", http=e.code, detail=detail)  # definitieve weigering, niet gestart
            return s, f"HTTP {e.code}: {detail[:300]}"
        except Exception as e:
            return s, f"FOUT {type(e).__name__}: {e}"
    with ThreadPoolExecutor(4) as ex:
        for s, r in ex.map(safe, slugs):
            print(s, r, flush=True)

"""
Bewegende AI-renders via ElevenLabs Image & Video (Veo 3.1): portret-startframe -> 8 s, 1080x1920, 9:16.

Per foto: upload van het portretframe naar /v1/assets, daarna /v1/flows/video. De generatie-ID wordt
direct in ai-renders/ledger.json bewaard (één schrijver, met lock). Een onzekere POST wordt nooit
automatisch herhaald: status "onzeker" vraagt om handmatige controle.

Gebruik: python3 scripts/ai_video.py <slug> [<slug> ...]   (prompts in scripts/ai_prompts.json)
Authenticatie: de omgeving injecteert xi-api-key voor api.elevenlabs.io (of ELEVENLABS_API_KEY).
"""
import fcntl, json, os, subprocess, sys, time, urllib.request, uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AI = ROOT / "ai-renders"
LEDGER = AI / "ledger.json"
NEG = ("people appearing, new objects, changing the architecture, extra floors, distortion, warping, morphing, "
       "flicker, text, logos, cartoon, fast camera movement, cuts, transitions")
STIJL = " One continuous shot, no cuts, no transitions, no morphing. Keep the building, proportions, materials and layout exactly as in the photo."


def headers(extra=None):
    h = dict(extra or {})
    if os.environ.get("ELEVENLABS_API_KEY"):
        h["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
    return h


def ledger_update(slug, **kw):
    with open(AI / "ledger.lock", "a+") as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        data = json.loads(LEDGER.read_text()) if LEDGER.exists() else {}
        data.setdefault(slug, {}).update(kw)
        LEDGER.write_text(json.dumps(data, indent=1, ensure_ascii=False))
        return data[slug]


def ledger_get(slug):
    return (json.loads(LEDGER.read_text()) if LEDGER.exists() else {}).get(slug, {})


def api(method, url, body=None, hdr=None, timeout=120):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers({"Content-Type": "application/json", **(hdr or {})}))
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def upload_asset(pad, naam):
    out = subprocess.run(["curl", "-sS", "-f", "-X", "POST", "https://api.elevenlabs.io/v1/assets", "-F", f"asset=@{pad};type=image/jpeg", "-F", f"name={naam}"],
                         capture_output=True, text=True)
    if out.returncode:
        raise RuntimeError("asset-upload mislukt: " + out.stderr[:200])
    return json.loads(out.stdout)


def submit(slug, prompt):
    st = ledger_get(slug)
    if st.get("generation_id") or st.get("status") == "onzeker":
        return st  # nooit opnieuw betalen
    frame = AI / "portret" / f"{slug}.jpg"
    if not st.get("asset_id"):
        a = upload_asset(frame, f"ace-fase-2 {slug}")
        st = ledger_update(slug, asset_id=a.get("id") or a.get("asset_id"))
    ledger_update(slug, status="indienen", prompt=prompt)
    body = {"model_id": "veo-3.1-generate-001", "prompt": prompt + STIJL, "negative_prompt": NEG, "aspect_ratio": "9:16",
            "duration_secs": 8, "resolution": "1080p", "generate_audio": False,
            "start_frame": {"type": "asset", "asset_id": st["asset_id"]}}
    try:
        gen = api("POST", "https://api.elevenlabs.io/v1/flows/video", body)
    except urllib.error.HTTPError as e:
        # 4xx = geweigerd vóór facturatie; alles anders is onzeker
        txt = e.read()[:500].decode(errors="replace")
        ledger_update(slug, status="geweigerd" if 400 <= e.code < 500 else "onzeker", fout=f"{e.code} {txt}")
        raise
    except Exception as e:
        ledger_update(slug, status="onzeker", fout=repr(e)[:300])
        raise
    return ledger_update(slug, generation_id=gen["id"], status="ingediend", ingediend=time.time())


def wacht_en_download(slug):
    st = ledger_get(slug)
    uit = AI / "clips" / f"{slug}.mp4"
    if uit.exists():
        return uit
    wacht = 15
    for _ in range(120):
        r = api("GET", f"https://api.elevenlabs.io/v1/flows/video/{st['generation_id']}")
        if r["status"] in ("completed", "failed"):
            break
        time.sleep(wacht)
        wacht = min(45, wacht * 1.2)
    if r["status"] != "completed":
        ledger_update(slug, status="mislukt", fout=str(r)[:400])
        raise RuntimeError(f"{slug}: {r.get('failure_reason')} {r.get('error_message')}")
    # content_url is een ondertekende URL: geen provider-credentials meesturen
    urllib.request.urlretrieve(r["content_url"], uit)
    ledger_update(slug, status="gedownload", provider=r.get("content_url", "").split("?")[0])
    return uit


if __name__ == "__main__":
    prompts = json.loads((ROOT / "scripts/ai_prompts.json").read_text())
    from concurrent.futures import ThreadPoolExecutor
    slugs = sys.argv[1:]
    for s in slugs:  # indienen: sequentieel (één schrijver)
        submit(s, prompts[s])
        print(s, ledger_get(s).get("generation_id"), flush=True)
    with ThreadPoolExecutor(4) as ex:
        for s, f in zip(slugs, ex.map(wacht_en_download, slugs)):
            print(s, "klaar", f, flush=True)

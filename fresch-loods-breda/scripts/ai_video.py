"""
Bewegende beelden via ElevenLabs Image & Video (Veo 3.1, 1080p, 9:16) vanuit een STAANDE startfoto.

1. POST /v1/assets  (multipart: asset, name) -> asset_id
2. POST /v1/flows/video  start_frame={"type":"asset","asset_id":...}
3. Generatie-ID direct vastleggen in bronnen/generaties/<naam>.json, dan pollen en downloaden.
Een aanvraag met onzekere afloop wordt nooit blind herhaald (bestaand ledgerbestand => hervatten/stoppen).
Authenticatie: netwerksecret van de cloudomgeving (xi-api-key) of ELEVENLABS_API_KEY in env.

Gebruik: python3 scripts/ai_video.py <naam> <startframe.jpg> "<prompt>"
"""
import hashlib, json, os, subprocess, sys, time, urllib.request, urllib.error, uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODEL = "veo-3.1-generate-001"
VAST = " One continuous shot, no cuts, no transitions, no morphing."
NEGATIEF = ("cuts, transitions, morphing, warping, distortion, changing architecture, new buildings, extra floors, "
            "flicker, text, logos, watermark, borders, letterbox, fast camera movement")


def hdrs(extra=None):
    h = dict(extra or {})
    if os.environ.get("ELEVENLABS_API_KEY"):
        h["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
    return h


def call(url, data=None, headers=None, method=None):
    req = urllib.request.Request(url, data=data, headers=hdrs(headers), method=method)
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.loads(r.read()), {k.lower(): v for k, v in r.headers.items()}


def bewaar(pad, d):
    tmp = pad.with_suffix(".tmp")
    tmp.write_text(json.dumps(d, indent=1))
    tmp.replace(pad)


def main():
    naam, frame, prompt = sys.argv[1], Path(sys.argv[2]).resolve(), sys.argv[3] + VAST
    ledger = ROOT / f"bronnen/generaties/{naam}.json"
    uit = ROOT / f"bronnen/ai-clips/{naam}.mp4"
    raw = frame.read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    d = json.loads(ledger.read_text()) if ledger.exists() else {"naam": naam, "startframe": str(frame.relative_to(ROOT)),
                                                                  "startframe_sha256": sha, "model_id": MODEL}
    if d["startframe_sha256"] != sha:
        sys.exit(f"{naam}: startframe gewijzigd sinds eerdere generatie")
    if "asset_id" not in d:
        grens = uuid.uuid4().hex
        body = (f"--{grens}\r\nContent-Disposition: form-data; name=\"name\"\r\n\r\n{naam}\r\n"
                f"--{grens}\r\nContent-Disposition: form-data; name=\"asset\"; filename=\"{frame.name}\"\r\n"
                f"Content-Type: image/jpeg\r\n\r\n").encode() + raw + f"\r\n--{grens}--\r\n".encode()
        r, _ = call("https://api.elevenlabs.io/v1/assets", body, {"Content-Type": f"multipart/form-data; boundary={grens}"})
        d["asset_id"] = r.get("asset_id") or r.get("id")
        bewaar(ledger, d)
    if "generation_id" not in d:
        if d.get("verzonden"):
            sys.exit(f"{naam}: eerdere generatie-aanvraag met onzekere afloop; niet herhalen")
        d["verzonden"] = True
        d["prompt"] = prompt
        bewaar(ledger, d)
        body = {"model_id": MODEL, "prompt": prompt, "negative_prompt": NEGATIEF, "aspect_ratio": "9:16",
                "duration_secs": 8, "resolution": "1080p", "generate_audio": False,
                "start_frame": {"type": "asset", "asset_id": d["asset_id"]}}
        try:
            r, h = call("https://api.elevenlabs.io/v1/flows/video", json.dumps(body).encode(), {"Content-Type": "application/json"})
        except urllib.error.HTTPError as e:
            d["verzonden"] = False
            d["fout"] = f"{e.code} {e.read(500).decode(errors='replace')}"
            bewaar(ledger, d)
            sys.exit(f"{naam}: geweigerd {d['fout']}")
        d["generation_id"] = r["id"]
        d["request_id"] = h.get("request-id")
        d["character_cost"] = h.get("character-cost")
        d["response_headers"] = {k: v for k, v in h.items() if any(x in k for x in ("request", "cost", "credit", "-id"))}
        bewaar(ledger, d)
        print(naam, "ingediend", flush=True)
    wacht = 15
    for _ in range(120):
        r, _ = call(f"https://api.elevenlabs.io/v1/flows/video/{d['generation_id']}")
        if r.get("status") in ("completed", "failed"):
            break
        time.sleep(wacht)
        wacht = min(45, wacht * 1.2)
    d["status"] = r.get("status")
    d["provider_status"] = {k: v for k, v in r.items() if k not in ("content_url",) and not isinstance(v, (dict, list))}
    bewaar(ledger, d)
    if r.get("status") != "completed":
        sys.exit(f"{naam}: {r.get('status')} {r.get('failure_reason')} {r.get('error_message')}")
    if not uit.exists():
        tmp = uit.with_suffix(".part")
        with urllib.request.urlopen(r["content_url"], timeout=300) as resp:  # geen credentials naar deze host
            tmp.write_bytes(resp.read())
        tmp.replace(uit)
    p = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                   "stream=width,height,sample_aspect_ratio:stream_side_data=rotation:format=duration",
                                   "-of", "json", str(uit)], capture_output=True, text=True).stdout)
    d["clip_sha256"] = hashlib.sha256(uit.read_bytes()).hexdigest()
    d["probe"] = p
    bewaar(ledger, d)
    s = p["streams"][0]
    print(naam, "klaar", s["width"], "x", s["height"], p["format"]["duration"], flush=True)


if __name__ == "__main__":
    main()

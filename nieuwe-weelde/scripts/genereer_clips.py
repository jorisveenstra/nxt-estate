"""Beeld -> video via ElevenLabs Image & Video (veo-3.1-generate-001, 1080p, 9:16, 8 s, zonder audio).

Per portretfoto: upload als asset -> start flow -> generatie-ID direct in scripts/gen-ledger.json -> poll -> download naar public/clips/.
Een foto waarvoor al een generatie-ID bestaat wordt nooit opnieuw gestart (alleen verder gepold).
Authenticatie loopt via de proxy (xi-api-key wordt ingevoegd); er staat geen sleutel in de repo.
Gebruik: python3 scripts/genereer_clips.py naam [naam ...]
"""
import fcntl
import json
import subprocess
import sys
import time
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "scripts/gen-ledger.json"
API = "https://api.elevenlabs.io"
NO_CUTS = "one continuous shot, no cuts, no transitions, no morphing"
PROMPTS = {
    "gevel-zomer": "Slow gentle push-in towards the apartment building facade, leaves rustling softly, children playing on the lawn, soft summer light. Preserve the architecture exactly.",
    "gracht-zon": "Slow gentle upward tilt along the apartment building next to the canal, water rippling softly, swans drifting, grass swaying in a light breeze. Preserve the architecture exactly.",
    "gracht-hoek": "Slow gentle camera drift along the canal towards the apartment building, small ripples on the water, a rowing boat floating quietly, trees moving slightly. Preserve the architecture exactly.",
    "park-pad": "Slow gentle push-in along the garden path towards the building, people sitting at the picnic table, birds flying in the sky, grass swaying. Preserve the architecture exactly.",
    "daktuin": "Subtle gentle camera drift over the shoulder of the woman on the balcony looking at the communal garden, leaves moving in the breeze, people moving slowly in the garden. Preserve the architecture exactly.",
    "woonkamer-man": "Slow gentle push-in on the living room, the man slowly lifts his cup, soft daylight through the windows, curtains moving very slightly. Preserve the interior exactly.",
    "buurtkamer": "Slow gentle push-in on the community room, neighbours chatting at the table, a man walking slowly towards the garden door, soft sunlight. Preserve the interior exactly.",
    "woonkamer-b": "Slow gentle camera drift forward in the bright living room, a child plays on the rug in the distance, soft sunlight through the windows. Preserve the interior exactly.",
    "balkon-c": "Slow gentle push-in on the living room, people chatting at the dining table, soft warm sunlight and drifting dust particles. Preserve the interior exactly.",
    "luchtfoto-wijk": "Slow gentle aerial drone drift forward over the apartment buildings and canal, trees moving slightly, soft morning light. Preserve the architecture exactly.",
    "luchtfoto-hoorn": "Slow gentle aerial drone drift forward over the town and the apartment buildings, soft hazy morning light. Preserve the architecture exactly.",
}


def req(method, path, data=None, headers=None, timeout=300):
    r = urllib.request.Request(API + path, data=data, headers=headers or {}, method=method)
    with urllib.request.urlopen(r, timeout=timeout) as resp:
        return json.loads(resp.read())


def ledger_update(naam, **kv):
    with open(LEDGER, "a+") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        f.seek(0)
        t = f.read()
        d = json.loads(t) if t else {}
        d.setdefault(naam, {}).update(kv)
        f.seek(0)
        f.truncate()
        json.dump(d, f, indent=1)


def ledger_get(naam):
    if not LEDGER.exists():
        return {}
    with open(LEDGER) as f:
        fcntl.flock(f, fcntl.LOCK_SH)
        return json.loads(f.read() or "{}").get(naam, {})


def upload_asset(naam):
    pad = ROOT / f"public/portret/{naam}.png"
    b = uuid.uuid4().hex
    body = (f'--{b}\r\nContent-Disposition: form-data; name="name"\r\n\r\nnieuwe-weelde-{naam}\r\n'
            f'--{b}\r\nContent-Disposition: form-data; name="asset"; filename="{naam}.png"\r\nContent-Type: image/png\r\n\r\n').encode() + pad.read_bytes() + f"\r\n--{b}--\r\n".encode()
    return req("POST", "/v1/assets", body, {"Content-Type": f"multipart/form-data; boundary={b}"})


def main(naam):
    st = ledger_get(naam)
    if "generation_id" not in st:
        if "asset_id" not in st:
            a = upload_asset(naam)
            print(naam, "asset", a)
            ledger_update(naam, asset_id=a.get("asset_id") or a.get("id"), asset_response=a)
            st = ledger_get(naam)
        body = {"model_id": "veo-3.1-generate-001", "prompt": f"{PROMPTS[naam]} {NO_CUTS}.", "start_frame": {"type": "asset", "asset_id": st["asset_id"]},
                "resolution": "1080p", "duration_secs": 8, "generate_audio": False, "aspect_ratio": "9:16"}
        ledger_update(naam, request=body, status="posting")
        g = req("POST", "/v1/flows/video", json.dumps(body).encode(), {"Content-Type": "application/json"})
        print(naam, "flow", g)
        ledger_update(naam, generation_id=g.get("generation_id") or g.get("id"), flow_response=g, status="gestart")
        st = ledger_get(naam)
    gid = st["generation_id"]
    while True:
        s = req("GET", f"/v1/flows/video/{gid}")
        status = s.get("status")
        if status in ("completed", "failed"):
            break
        time.sleep(10)
    ledger_update(naam, poll_response={k: v for k, v in s.items() if k != "content_url"}, status=status)
    if status != "completed":
        raise SystemExit(f"{naam}: {s}")
    uit = ROOT / f"public/clips/{naam}.mp4"
    uit.parent.mkdir(exist_ok=True)
    urllib.request.urlretrieve(s["content_url"], uit)  # zonder referenties naar provider-sleutels
    probe = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "stream=width,height,sample_aspect_ratio:stream_tags=rotate:format=duration", "-of", "json", str(uit)], text=True)
    ledger_update(naam, probe=json.loads(probe))
    print(naam, probe.replace("\n", ""))


if __name__ == "__main__":
    for n in sys.argv[1:]:
        main(n)

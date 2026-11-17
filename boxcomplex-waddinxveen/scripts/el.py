"""ElevenLabs-hulpjes. Geen sleutels in deze repo: in de cloud injecteert de proxy xi-api-key.
Lokaal: zet ELEVENLABS_API_KEY in de omgeving (wordt dan als header meegestuurd).
Elke betaalde aanroep wordt vóór het versturen in generatie/ledger.json vastgelegd (status 'verzonden'),
zodat een onzekere uitkomst nooit blind herhaald wordt.
"""
import json, os, fcntl, time, urllib.request, urllib.error, pathlib, uuid
ROOT = pathlib.Path(__file__).resolve().parent.parent
LEDGER = ROOT / "generatie" / "ledger.json"
API = "https://api.elevenlabs.io"
UA = {"User-Agent": "video-ads-agent/1.0"}

def _headers(extra=None):
    h = dict(UA)
    if os.environ.get("ELEVENLABS_API_KEY"):
        h["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
    h.update(extra or {})
    return h

def ledger_update(key, **values):
    LEDGER.parent.mkdir(exist_ok=True)
    fd = os.open(LEDGER, os.O_CREAT | os.O_RDWR, 0o644)
    with os.fdopen(fd, "r+") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        raw = f.read(); data = json.loads(raw) if raw else {}
        data.setdefault(key, {}).update(values)
        f.seek(0); f.truncate(); json.dump(data, f, indent=1, ensure_ascii=False); f.flush(); os.fsync(f.fileno())
        return data[key]

def ledger_get(key):
    if not LEDGER.exists(): return None
    with LEDGER.open() as f:
        fcntl.flock(f, fcntl.LOCK_SH); raw = f.read()
    return (json.loads(raw) if raw else {}).get(key)

def request(method, path, body=None, raw=None, ctype="application/json", timeout=300):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    h = _headers({"Content-Type": ctype} if data is not None else {})
    req = urllib.request.Request(API + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, dict(r.headers.items()), r.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers.items()), e.read()

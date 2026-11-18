"""
Gedeelde ElevenLabs-helpers voor Apollolaan 48a.

- Authenticatie: de cloudomgeving injecteert de xi-api-key voor api.elevenlabs.io (netwerk-secret).
  Lokaal kan ELEVENLABS_API_KEY in ~/.elevenlabs staan; die wordt dan meegestuurd. Nooit in de repo.
- Elke betaalde aanroep wordt vóór het versturen vastgelegd in bron/generaties.json (met lock),
  zodat een onzekere uitkomst nooit blind herhaald wordt.
- Verbruik (request-id + character-cost) gaat via de portal-bridge (optioneel, alleen tijdens een portal-job).
"""
import fcntl
import json
import os
import time
import urllib.error
import urllib.request
import uuid
from contextlib import contextmanager
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "bron/generaties.json"
API = "https://api.elevenlabs.io"


def _key():
    p = Path.home() / ".elevenlabs"
    if p.exists():
        for r in p.read_text().splitlines():
            if r.startswith("ELEVENLABS_API_KEY="):
                return r.split("=", 1)[1].strip()
    return os.environ.get("ELEVENLABS_API_KEY")


def headers(extra=None):
    h = dict(extra or {})
    k = _key()
    if k:
        h["xi-api-key"] = k
    return h


@contextmanager
def ledger():
    LEDGER.parent.mkdir(parents=True, exist_ok=True)
    with open(LEDGER, "a+", encoding="utf8") as f:
        fcntl.flock(f.fileno(), fcntl.LOCK_EX)
        f.seek(0)
        txt = f.read()
        data = json.loads(txt) if txt.strip() else {}
        yield data
        f.seek(0)
        f.truncate()
        json.dump(data, f, indent=1, ensure_ascii=False)
        f.flush()
        os.fsync(f.fileno())


def get_entry(key):
    with ledger() as d:
        return d.get(key)


def set_entry(key, **values):
    with ledger() as d:
        e = d.setdefault(key, {})
        e.update(values)
        return dict(e)


_bridge = None


def bridge():
    """Portal-bridge alleen als NXT_BRIDGE_TOOLS gezet is (tijdens een portal-job)."""
    global _bridge
    if _bridge is None and os.environ.get("NXT_BRIDGE_TOOLS"):
        import sys
        sys.path.insert(0, os.environ["NXT_BRIDGE_TOOLS"])
        from b import tracked  # noqa
        cwd = os.getcwd()
        _bridge = tracked()
        os.chdir(cwd)
    return _bridge


import threading
_lock = threading.Lock()


def record(category, model, request_id, hdrs, characters=None, seconds=None):
    """Alle paden in deze scripts zijn absoluut; de bridge-ledger staat relatief in NXT_JOB_DIR."""
    with _lock:
        b = bridge()
        if not b or not request_id:
            return None
        cwd = os.getcwd()
        try:
            os.chdir(os.environ["NXT_JOB_DIR"])
            return b.record_elevenlabs(category, model, request_id, headers=dict(hdrs),
                                       characters=characters, seconds=seconds)
        except Exception as e:  # verbruiksrapportage mag nooit tot hergeneratie leiden
            print("verbruik niet gerapporteerd:", type(e).__name__, e, flush=True)
        finally:
            os.chdir(cwd)


def request(method, path, body=None, data=None, content_type="application/json", timeout=300):
    """Geeft (status, headers, bytes)."""
    if body is not None:
        data = json.dumps(body).encode()
    h = headers({"Content-Type": content_type} if data is not None else {})
    req = urllib.request.Request(API + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read()


def multipart(fields, files):
    boundary = uuid.uuid4().hex
    out = b""
    for k, v in fields.items():
        out += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode()
    for k, (fname, mime, content) in files.items():
        out += (f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"; filename=\"{fname}\"\r\n"
                f"Content-Type: {mime}\r\n\r\n").encode() + content + b"\r\n"
    out += f"--{boundary}--\r\n".encode()
    return out, f"multipart/form-data; boundary={boundary}"


def download(url, dest):
    # Geen API- of portal-credentials naar de CDN-host sturen.
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8"})
    with urllib.request.urlopen(req, timeout=600) as r:
        Path(dest).write_bytes(r.read())


def now():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

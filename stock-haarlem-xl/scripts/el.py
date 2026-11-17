"""ElevenLabs helpers for STOCK Haarlem XL (geen sleutels in code: de cloud-proxy injecteert xi-api-key).

Elke betaalde POST wordt eerst als 'pending' in een grootboek gezet; een pending zonder resultaat wordt
nooit blind herhaald. Verbruik wordt per request-id gemeld via de portal-bridge (optioneel).
"""
import fcntl, json, os, subprocess, time, urllib.request, uuid
from pathlib import Path

API = "https://api.elevenlabs.io"
ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "bronnen/generaties.json"


class Ledger:
    def __init__(self, path=LEDGER):
        self.path = path
        path.parent.mkdir(exist_ok=True, parents=True)
        path.touch()

    def update(self, key, fn):
        with self.path.open("r+") as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            raw = f.read()
            data = json.loads(raw) if raw else {}
            data[key] = fn(data.get(key))
            f.seek(0); f.truncate(); json.dump(data, f, indent=1, ensure_ascii=False); f.flush(); os.fsync(f)
            return data[key]

    def get(self, key):
        with self.path.open("r") as f:
            fcntl.flock(f, fcntl.LOCK_SH)  # nooit een half geschreven grootboek lezen
            raw = f.read()
        return (json.loads(raw) if raw else {}).get(key)


def request(method, path, body=None, headers=None, raw=None, timeout=600):
    h = dict(headers or {})
    data = raw
    if body is not None:
        data = json.dumps(body).encode(); h["Content-Type"] = "application/json"
    req = urllib.request.Request(API + path, data=data, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), {k.lower(): v for k, v in r.headers.items()}


def paid(ledger, key, method, path, body=None, raw=None, headers=None, meta=None):
    """Voer een betaalde call precies één keer uit. Geeft (content, headers) of de eerder opgeslagen meta."""
    prev = ledger.get(key)
    if prev and prev.get("status") == "done":
        return None, prev
    if prev and prev.get("status") == "pending":
        raise RuntimeError(f"{key}: eerdere aanvraag met onzekere uitkomst; niet blind herhalen")
    ledger.update(key, lambda _: {"status": "pending", "started": time.time(), **(meta or {})})
    try:
        content, hdr = request(method, path, body=body, raw=raw, headers=headers)
    except urllib.error.HTTPError as e:
        detail = e.read(2000).decode(errors="replace")
        ledger.update(key, lambda v: {**v, "status": "failed", "http": e.code, "detail": detail[:500],
                                       "request_id": e.headers.get("request-id")})
        raise RuntimeError(f"{key}: HTTP {e.code} {detail[:300]}") from None
    return content, hdr


def report(category, model, request_id, headers, **units):
    """Meld verbruik aan de portal (alleen als de bridge-config aanwezig is)."""
    if not os.environ.get("NXT_BRIDGE_BIN") or not request_id:
        return
    import sys
    sys.path.insert(0, os.environ["NXT_BRIDGE_BIN"])
    from pb import bridge
    cwd = os.getcwd()
    os.chdir(os.environ["NXT_BRIDGE_JOBDIR"])
    try:
        print(category, bridge().record_elevenlabs(category, model, request_id, headers=headers, **units))
    finally:
        os.chdir(cwd)

"""Kleine ElevenLabs-client voor dit project.

Authenticatie: in de Claude-cloudomgeving injecteert de proxy de sleutel voor api.elevenlabs.io;
lokaal wordt ELEVENLABS_API_KEY uit ~/.elevenlabs gelezen (als dat bestand bestaat).
Elke betaalde aanvraag schrijft een bon naar scripts/receipts/ (alleen request-id, model,
categorie en character-cost; nooit sleutels of tokens) zodat het verbruik later exact te
rapporteren is en een aanvraag nooit blind herhaald wordt.
"""
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RECEIPTS = ROOT / "scripts/receipts"
API = "https://api.elevenlabs.io"


def _headers(extra=None):
    h = {"User-Agent": "video-ads/1.0", **(extra or {})}
    f = Path.home() / ".elevenlabs"
    if f.exists():
        for regel in f.read_text().splitlines():
            if regel.startswith("ELEVENLABS_API_KEY="):
                h["xi-api-key"] = regel.split("=", 1)[1].strip()
    return h


def request(method, path, body=None, data=None, content_type="application/json", timeout=600):
    """Geeft (status, headers, bytes). body = JSON-dict, data = ruwe bytes."""
    if body is not None:
        data = json.dumps(body).encode()
    req = urllib.request.Request(API + path, data=data, method=method,
                                 headers=_headers({"Content-Type": content_type} if data is not None else {}))
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, {k.lower(): v for k, v in r.headers.items()}, r.read()
    except urllib.error.HTTPError as e:
        return e.code, {k.lower(): v for k, v in e.headers.items()}, e.read()


def bon(naam, category, model, headers, **extra):
    """Bewaar de facturatiegegevens van één aanvraag (geen geheimen)."""
    RECEIPTS.mkdir(parents=True, exist_ok=True)
    data = {"category": category, "model": model, "request_id": headers.get("request-id"),
            "character_cost": headers.get("character-cost"),
            "history_item_id": headers.get("history-item-id"), "time": time.time(),
            "headers": {k: v for k, v in headers.items() if k not in ("set-cookie", "authorization", "xi-api-key")},
            **extra}
    (RECEIPTS / f"{naam}.json").write_text(json.dumps(data, indent=1))
    return data

"""Kleine portalclient (eigen, zonder derde partij): voortgang en gebruiksrapportage. Token/runId komen uit de omgeving."""
import json, os, urllib.request, urllib.error, uuid, pathlib, fcntl

JOB = os.environ["NXT_JOB_URL"]; TOKEN = os.environ["NXT_JOB_TOKEN"]; RUN = os.environ["NXT_RUN_ID"]
LEDGER = pathlib.Path(os.environ.get("NXT_USAGE_LEDGER", "/tmp/claude-0/work/usage-ledger.json"))

def post(action, values=None):
    req = urllib.request.Request(JOB + "/" + action, json.dumps({"runId": RUN, **(values or {})}).encode(),
        {"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json", "User-Agent": "curl/8"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=180) as r: return json.load(r)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"portal {action} {e.code}: {e.read(300)!r}")

def progress(p, msg): return post("progress", {"progress": p, "message": msg})

def record_eleven(category, model, request_id, credits=None, characters=None, seconds=None):
    usage = {}
    if credits is not None: usage["credits"] = float(credits)
    if characters is not None: usage["characters"] = float(characters)
    if seconds is not None: usage["seconds"] = float(seconds)
    item = {"eventId": str(uuid.uuid5(uuid.NAMESPACE_URL, "elevenlabs:" + request_id)), "category": category,
            "provider": "elevenlabs", "model": model, "usage": usage}
    LEDGER.touch()
    with open(LEDGER, "r+") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        raw = f.read(); d = json.loads(raw) if raw else {}
        d[item["eventId"]] = {"item": item, "request_id": request_id, "pending": True}
        f.seek(0); f.truncate(); json.dump(d, f)

def flush():
    with open(LEDGER, "r+") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        raw = f.read(); d = json.loads(raw) if raw else {}
        pend = [v for v in d.values() if v["pending"]]
        for i in range(0, len(pend), 100):
            post("usage", {"items": [v["item"] for v in pend[i:i+100]]})
            for v in pend[i:i+100]: v["pending"] = False
        f.seek(0); f.truncate(); json.dump(d, f)
    return len(pend)

import os, sys, json, pathlib, urllib.request, urllib.error, subprocess
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from portal_bridge import PortalBridge
JOB = "https://portal.nxt-estate.com/api/content-video-agent/jobs/2a61d1ec-d5ce-438d-857b-9e9e3a60fc81"
STATE = pathlib.Path(os.environ["MARK3_STATE"])  # buiten de repo: ledgers, receipts
def bridge():
    os.chdir(STATE)
    b = PortalBridge(JOB, (STATE / "token").read_text().strip(), ["https://portal.nxt-estate.com"])
    b.run_id = (STATE / "runid.txt").read_text().strip()
    return b
def el(method, path, body=None, raw=None, headers=None, timeout=300):
    h = {"User-Agent": "curl/8.5.0", "xi-api-key": "proxy-injected"}
    if body is not None: h["Content-Type"] = "application/json"; raw = json.dumps(body).encode()
    h.update(headers or {})
    r = urllib.request.Request("https://api.elevenlabs.io" + path, data=raw, headers=h, method=method)
    with urllib.request.urlopen(r, timeout=timeout) as resp:
        return resp.read(), dict(resp.headers)

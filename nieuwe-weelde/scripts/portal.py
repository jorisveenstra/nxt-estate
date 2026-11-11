"""Kleine CLI rond portal_bridge (tools/portal_bridge.py, de actuele versie van het portaal).

jobUrl/jobToken/runId staan in een bestand BUITEN de repo (NXT_JOB_DIR/job.json en runid.txt), nooit in git of bron-ZIP.
Gebruiksreceipts (.nxt-usage-*.json) worden ook in NXT_JOB_DIR geschreven.
Gebruik: python3 scripts/portal.py progress 40 "Voice-over maken" | fail "korte melding" | usage
"""
import json
import os
import sys
from pathlib import Path
from urllib.parse import urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parent))
from portal_bridge import PortalBridge  # noqa: E402

ORIGINS = ["https://portal.nxt-estate.com"]
JOB_DIR = Path(os.environ["NXT_JOB_DIR"])


def bridge():
    job = json.loads((JOB_DIR / "job.json").read_text())
    u = urlsplit(job["jobUrl"])
    if (u.scheme != "https" or f"https://{u.netloc}" not in ORIGINS or u.path != "/api/content-video-agent/jobs/" + job["jobId"]
            or u.query or u.fragment or u.username or u.password):
        raise SystemExit("jobUrl niet toegestaan")
    b = PortalBridge(job["jobUrl"], job["jobToken"], ORIGINS)
    b.run_id = (JOB_DIR / "runid.txt").read_text().strip()
    sid = os.environ.get("CLAUDE_SESSION_ID")
    if sid:
        b.usage_transcript = (str(Path(os.environ["CLAUDE_TRANSCRIPT"]).resolve()), sid)
    os.chdir(JOB_DIR)  # receipts buiten de repo
    return b


if __name__ == "__main__":
    b = bridge()
    if sys.argv[1] == "progress":
        print(b.progress(int(sys.argv[2]), sys.argv[3]))
    elif sys.argv[1] == "fail":
        print(b.fail(sys.argv[2]))
    elif sys.argv[1] == "usage":
        print(b.refresh_usage())

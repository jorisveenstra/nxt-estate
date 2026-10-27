"""Kleine CLI rond portal_bridge: progress / fail / upload. Token en runId komen uit de omgeving of bestanden buiten de repo."""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from portal_bridge import PortalBridge  # noqa: E402

ORIGINS = ["https://portal.nxt-estate.com"]
JOB = "https://portal.nxt-estate.com/api/content-video-agent/jobs/35fdf595-42c2-4f1d-96da-cdf116025e4e"


def bridge():
    b = PortalBridge(JOB, Path(os.environ["JOB_TOKEN_FILE"]).read_text().strip(), ORIGINS)
    b.run_id = Path(os.environ["RUN_ID_FILE"]).read_text().strip()
    return b


if __name__ == "__main__":
    b = bridge()
    if sys.argv[1] == "progress":
        print(b.progress(int(sys.argv[2]), sys.argv[3]))
    elif sys.argv[1] == "fail":
        print(b.fail(sys.argv[2]))

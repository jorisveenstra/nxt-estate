"""Uploadt alle video's + bron-ZIP's via de portal-bridge en rondt de job af. Token via omgeving (JOB_TOKEN), nooit loggen."""
import json, os, sys, uuid
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from portal_bridge import PortalBridge

ROOT = Path(__file__).resolve().parent.parent
state = ROOT / "out/upload_state.json"
ids = json.loads(state.read_text()) if state.exists() else {}
br = PortalBridge(os.environ["JOB_URL"], os.environ["JOB_TOKEN"], ["https://portal.nxt-estate.com"])
br.run_id = os.environ["RUN_ID"]
for b in (1, 2, 3):
    for h in range(1, 6):
        k = f"{b}-{h}"
        if ids.get(k, {}).get("done"):
            br.outputs.append(ids[k]["id"]); continue
        oid = ids.get(k, {}).get("id") or str(uuid.uuid4())
        ids[k] = {"id": oid}; state.write_text(json.dumps(ids))
        br.upload(f"Body {b} Hook {h}", ROOT / f"out/body{b}-hook{h}.mp4", ROOT / f"out/bron/body{b}-hook{h}-bron.zip", output_id=oid)
        ids[k]["done"] = True; state.write_text(json.dumps(ids))
        print("geupload", k, flush=True)
        br.progress(70 + (b - 1) * 5 + h, f"Upload {len(br.outputs)}/15")
print(json.dumps(br.complete(list(dict.fromkeys(br.outputs))))[:300])

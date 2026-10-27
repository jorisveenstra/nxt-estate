"""Uploadt de 15 MP4's (direct naar Frame.io) + bron-ZIP's via portal_bridge en rondt de job af. outputId's worden lokaal bewaard voor veilige herhaling."""
import json
import os
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from portal import bridge  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
ids_pad = Path(os.environ["IDS_FILE"])
ids = json.loads(ids_pad.read_text()) if ids_pad.exists() else {}
b = bridge()
klaar = []
for body in (1, 2, 3):
    for hook in range(1, 6):
        titel = f"Body {body} Hook {hook}"
        n = f"Body-{body}-Hook-{hook}"
        oid = ids.setdefault(titel, str(uuid.uuid4()))
        ids_pad.write_text(json.dumps(ids))
        b.upload(titel, str(ROOT / f"out/final/{n}.mp4"), str(ROOT / f"out/zips/{n}-bron.zip"), output_id=oid)
        klaar.append(oid)
        print("geupload", titel, flush=True)
        b.progress(80 + len(klaar) // 1, f"Uploaden {len(klaar)}/15")
print(b.complete(klaar))

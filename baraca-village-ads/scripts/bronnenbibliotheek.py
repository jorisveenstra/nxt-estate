"""Bewaart de native 1080x1920-shots (afgeleid van de originele baraca_village-beelden) in de Frame.io-Bronnenbibliotheek
via library/uploads -> directe PUT per deel -> library/complete. Receipt (UUID) wordt vooraf lokaal bewaard."""
import hashlib, json, pathlib, subprocess, sys, time, urllib.request, uuid
sys.path.insert(0, str(pathlib.Path(__file__).parent)); import portal
ROOT = pathlib.Path(__file__).resolve().parent.parent
RECEIPTS = pathlib.Path("/tmp/claude-0/work/library-receipts.json")
rec = json.loads(RECEIPTS.read_text()) if RECEIPTS.exists() else {}
shots = json.loads((ROOT / "shots.json").read_text())
LIGHT = {"v01": "daglicht", "v02": "daglicht", "v03": "ochtendlicht", "v04": "golden hour", "v05": "golden hour", "v09": "warm daglicht",
         "v10": "warm daglicht", "v11": "ochtendlicht", "v13": "zonsondergang", "v12": "daglicht"}
INOUT = {"v09": "binnen", "v10": "binnen", "v11": "binnen"}
sel = sys.argv[1:] or [s["id"] for s in shots["shots"]]
for s in shots["shots"]:
    if s["id"] not in sel: continue
    p = ROOT / f"public/clips/{s['id']}.mp4"; sha = hashlib.sha256(p.read_bytes()).hexdigest()
    if sha in rec and rec[sha].get("done"): continue
    src = shots["sources"][s["src"]]
    title = f"Baraca Village - {s['subject']} - rustige pan fragment {s['id'][-1]} - {LIGHT[s['src']]} - 9x16"
    data = rec.get(sha, {}).get("data") or {
        "id": str(uuid.uuid4()), "title": title,
        "description": (f"Native 1080x1920 portretfragment (3 s, 30 fps) uitgesneden uit de originele bron '{src['file']}' (4K landschap) met een rustige "
                        f"horizontale pan binnen het bronbeeld; geen padding, geen vervorming. Zichtbaar: {s['subject']} van Baraca Village, Zuid-Lombok. "
                        f"Geschikt voor opening/hook, sfeerbeeld en overzicht. Beperking: gecropt uit landschapsbeeld, dus niet het volledige kader; AI-gegenereerd bronbeeld."),
        "tags": src["tags"].split(",") + ["pan", "9x16", "baraca_village"], "kind": "motion_clip", "contentType": "video/mp4",
        "size": p.stat().st_size, "sha256": sha, "sourceSha256": src["sha256"]}
    rec[sha] = {"data": data}; RECEIPTS.write_text(json.dumps(rec))
    grant = portal.post("library/uploads", data)
    with p.open("rb") as f:
        for part in grant["uploadParts"]:
            chunk = f.read(part["size"])
            req = urllib.request.Request(part["url"], chunk, {"Content-Type": "video/mp4", "x-amz-acl": "private"}, method="PUT")
            with urllib.request.urlopen(req, timeout=300) as r: assert 200 <= r.status < 300
    for attempt in range(25):
        try:
            res = portal.post("library/complete", {"assetId": grant["id"]}); break
        except RuntimeError as e:
            if "409" in str(e) and "verwerkt" in str(e) and attempt < 24: time.sleep(5); continue
            raise
    rec[sha]["done"] = True; RECEIPTS.write_text(json.dumps(rec)); print("opgeslagen", s["id"], res.get("available"), flush=True)

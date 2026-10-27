"""Maakt per video een bron-ZIP (zonder node_modules, .env, sleutels en eindvideo): python3 scripts/pak_bron.py b1 3 uit.zip"""
import hashlib, json, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
b, h, uit = sys.argv[1], sys.argv[2], sys.argv[3]
plan = json.loads((ROOT / "src/plan.json").read_text())
used = sorted({c["clip"] for p in (f"{b}-h{h}", f"{b}-body") for s in plan[p]["scenes"] for c in s["clips"]})
names = json.loads((ROOT / "scripts/clips-manifest.json").read_text())
files = ["package.json", "tsconfig.json", "remotion.config.ts", ".gitignore", "scripts/scripts.json", "scripts/maak_vo.py", "scripts/plan.py",
         "scripts/render.sh", "scripts/mix.sh", "scripts/pak_bron.py", "scripts/woorden.json", "scripts/clips-manifest.json", "package-lock.json"]
files += [str(p.relative_to(ROOT)) for p in (ROOT / "src").iterdir()]
files += [f"public/vo/{b}-h{h}.mp3", f"public/vo/{b}-body.mp3", "public/muziek/bali-lombok.mp3", "public/muziek/bali-lombok.json"]
files += [str(p.relative_to(ROOT)) for p in (ROOT / "public/fonts").iterdir()]
files += [str(p.relative_to(ROOT)) for p in (ROOT / "scripts/tts-cache").glob("*.json")]  # alignment + model_id/voice_id/request-id, geen sleutels
notes = {"voice": {"model_id": "eleven_v4", "voice_id": "YgjXqgzBJa9op0K278OW"}, "music": json.loads((ROOT / "public/muziek/bali-lombok.json").read_text()),
         "clips_gebruikt": [{"index": i, **names[str(i)]} for i in used], "output": "1080x1920 9:16, H.264 CRF 24",
         "opmerking": "public/clips/<index>.mp4 = goedgekeurde projectvideo's uit de job-snapshot (native 1080x1920); niet in de ZIP vanwege de 200 MB-limiet, zie clips-manifest.json (sha256). Montage: render.sh -> mix.sh."}
with zipfile.ZipFile(uit, "w", zipfile.ZIP_DEFLATED) as z:
    for f in files:
        if (ROOT / f).exists(): z.write(ROOT / f, f)
    z.writestr("BRON.json", json.dumps(notes, ensure_ascii=False, indent=1))
print(uit, Path(uit).stat().st_size)

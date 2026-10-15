"""Bouwt per video een bronarchief (ZIP) zonder node_modules/.env/geheimen en zonder eindrender. Gebruik: python3 scripts/pack.py <uitmap> <clipmap met proxies>"""
import json, re, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
out, prox = Path(sys.argv[1]), Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
cfg = (ROOT / "src/config.ts").read_text()
videos = [(m[0], m[1]) for m in re.findall(r"body: (\d+), hook: (\d+)", cfg)]

CMAP = dict(re.findall(r'^  (\w+): "([^"]+)",$', cfg.split("const C = {")[1].split("};")[0], re.M))

def clips_for(b, h):
    names = set()
    for line in cfg.splitlines():
        if re.match(rf'^  (b{b}h{h}:|"{b}:)', line):
            names |= {CMAP[k] for k in re.findall(r"C\.(\w+)", line)}
    return sorted(names)

for b, h in videos:
    zp = out / f"b{b}h{h}-bron.zip"
    with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
        for f in ["package.json", "package-lock.json", "tsconfig.json", "remotion.config.ts", "BRONNEN.md", ".gitignore"]:
            z.write(ROOT / f, f)
        for d in ["src", "scripts", "public/logo", "public/fonts", "public/muziek", "public/foto-jpg"]:
            for p in sorted((ROOT / d).rglob("*")):
                if p.is_file() and "tts-cache" not in p.parts and "__pycache__" not in p.parts:
                    z.write(p, str(p.relative_to(ROOT)))
        z.write(ROOT / f"public/vo/b{b}h{h}.wav", f"public/vo/b{b}h{h}.wav")
        for c in clips_for(b, h):
            z.write(prox / f"{c}.mp4", f"public/clips/{c}.mp4")
    print(zp, round(zp.stat().st_size / 1e6, 1), "MB")

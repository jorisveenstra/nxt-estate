"""Maakt per video een bewerkbaar bronarchief (Remotion-project + gebruikte media). Gebruik: python3 scripts/pack.py <body> <hook> <uit.zip>"""
import json, re, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
body, hook, uit = int(sys.argv[1]), int(sys.argv[2]), Path(sys.argv[3])
cfg = (ROOT / "src/config.ts").read_text()
def blok(naam):  # tekst van een object-literal in config.ts
    i = cfg.index(naam); return cfg[i:]
hooks = re.search(rf"\b{body}: \{{\n(.*?)\n  \}},", blok("HOOK_CLIPS"), re.S).group(1)
hookclip = re.search(rf'\b{hook}: \[\["([^"]+)"', hooks).group(1)
scenes = re.search(rf"\b{body}: \{{\n(.*?)\n  \}},", blok("const SCENE_CLIPS"), re.S).group(1)
clips = {hookclip, *re.findall(r'\["([a-z0-9-]+)", (?:null|"[^"]*")\]', scenes)}
rootpkg = json.loads((ROOT.parent / "package.json").read_text())
pkg = json.loads((ROOT / "package.json").read_text())
pkg["dependencies"], pkg["devDependencies"] = rootpkg["dependencies"], rootpkg["devDependencies"]
pkg["scripts"]["render"] = f"remotion render Body{body}-Hook{hook} out/video.mp4"
with zipfile.ZipFile(uit, "w", zipfile.ZIP_DEFLATED) as z:
    for p in ROOT.rglob("*"):
        r = p.relative_to(ROOT)
        if p.is_dir() or p.is_symlink() or r.parts[0] in ("node_modules", "out") or p.suffix == ".part" or p.name == ".env":
            continue
        if r.parts[:2] == ("public", "clips") and p.stem not in clips: continue
        if r.parts[:2] == ("public", "vo") and p.stem != f"b{body}h{hook}": continue
        if r.name == "package.json" and len(r.parts) == 1: continue
        z.write(p, str(r))
    z.writestr("package.json", json.dumps(pkg, indent=2))
    z.write(ROOT.parent / "package-lock.json", "package-lock.json")
    z.writestr("composition.json", json.dumps({"composition": f"Body{body}-Hook{hook}", "width": 1080, "height": 1920, "fps": 30, "clips": sorted(clips)}, indent=1))
print(uit, uit.stat().st_size // 1e6, "MB", sorted(clips))

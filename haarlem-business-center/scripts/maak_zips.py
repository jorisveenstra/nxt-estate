"""Bouwt per video een bron-ZIP (zonder node_modules, .git, credentials en zonder de gerenderde MP4)."""
import re, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = ROOT.parent
cfg = (ROOT / "src/config.ts").read_text()
OUT = ROOT / "out/bron"
OUT.mkdir(parents=True, exist_ok=True)


def clips(b, h):
    blok = re.search(rf"\n  b{b}: \[(.*?)\n  \],", cfg, re.S).group(1)
    s = set(x for m in re.findall(r'clips: \[(.*?)\]', blok) for x in re.findall(r'"([^"]+)"', m))
    s.add(re.search(rf'b{b}h{h}: "([^"]+)"', cfg).group(1))
    return sorted(s)


for b in (1, 2, 3):
    for h in range(1, 6):
        used = clips(b, h)
        files = [(p, p.relative_to(ROOT)) for sub in ("src", "scripts") for p in (ROOT / sub).rglob("*") if p.is_file() and "__pycache__" not in str(p) and not p.name.endswith(".mp3") or False]
        files = [(p, r) for p, r in files if not str(r).startswith("scripts/tts-cache") or p.suffix == ".json"]
        files += [(ROOT / f, Path(f)) for f in ("package.json", "remotion.config.ts", "tsconfig.json", "REVISIE.md", ".gitignore")]
        files += [(p, p.relative_to(ROOT)) for sub in ("public/fonts", "public/logo", "public/muziek") for p in (ROOT / sub).rglob("*") if p.is_file()]
        files += [(ROOT / f"public/vo/b{b}h{h}-hook.wav", Path(f"public/vo/b{b}h{h}-hook.wav")), (ROOT / f"public/vo/b{b}-body.wav", Path(f"public/vo/b{b}-body.wav"))]
        files += [(ROOT / f"public/clips/{c}.mp4", Path(f"public/clips/{c}.mp4")) for c in used]
        files += [(ROOT / "ai-renders/ledger.json", Path("ai-renders/ledger.json")), (REPO / "package.json", Path("package.json")), (REPO / "package-lock.json", Path("package-lock.json"))]
        size = sum(p.stat().st_size for p, _ in files)
        orig = [(ROOT / f"ai-renders/{c}.mp4", Path(f"ai-renders/{c}.mp4")) for c in used]
        if size + sum(p.stat().st_size for p, _ in orig) < 185_000_000:
            files += orig
        z = OUT / f"body{b}-hook{h}-bron.zip"
        with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
            for p, r in files:
                assert not any(x in str(r) for x in (".env", "node_modules", ".git/")), r
                zf.write(p, f"haarlem-business-center/{r}" if str(r) not in ("package.json", "package-lock.json") or p.parent == ROOT else str(r))
        print(z.name, z.stat().st_size // 1024 // 1024, "MB", "met originelen" if orig and orig[0] in files else "")

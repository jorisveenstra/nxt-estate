"""Bewerkbare bronarchieven per video: Remotion-project, scripts, voice-over van deze video, muziek, portretframes en clips,
ledger/provenance. Zonder node_modules, .git, .env, tokens en zonder gerenderde mp4's."""
import sys, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
UIT = ROOT / "out/zips"; UIT.mkdir(parents=True, exist_ok=True)
SKIP_DIRS = {"node_modules", "out", ".git", "__pycache__", "tts-cache", "vo", "clips"}
def maak(b, h):
    z = UIT / f"Body {b} Hook {h} - bron.zip"
    with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED, compresslevel=1) as zf:
        for p in sorted(ROOT.rglob("*")):
            rel = p.relative_to(ROOT)
            if p.is_dir() or p.is_symlink() or any(x in SKIP_DIRS for x in rel.parts) or rel.parts[0] == "ai-renders" and rel.parts[1:2] == ("bron",) or p.suffix in (".lock",) or p.name.startswith(".env"):
                continue
            if rel.parts[0] == "ai-renders" and p.name == "ledger.json":
                pass
            zf.write(p, f"ace-fase-2/{rel}")
        zf.write(ROOT / f"public/vo/b{b}h{h}.wav", f"ace-fase-2/public/vo/b{b}h{h}.wav")
        for c in sorted((ROOT / "ai-renders/clips").glob("*.mp4")):
            zf.write(ROOT / "out/proxy" / c.name, f"ace-fase-2/public/clips/{c.name}")
    return z
if __name__ == "__main__":
    for b in (1, 2, 3):
        for h in range(1, 6):
            z = maak(b, h); print(z.name, z.stat().st_size // 1_000_000, "MB", flush=True)

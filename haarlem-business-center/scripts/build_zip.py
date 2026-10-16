"""Bouwt per video een bewerkbare bronarchief-ZIP (zonder node_modules, .env, uitvoer-MP4's en geheimen)."""
import json, shutil, subprocess, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARCH = Path(sys.argv[1])  # map met gearchiveerde 1080x1920-clips (CRF 18)
PORT = Path(sys.argv[2])  # map met portretfoto's (start frames)
sys.path.insert(0, str(ROOT / "src"))
CFG = (ROOT / "src/config.ts").read_text()


def clips_for(b, h):
    import re
    cfg = json.loads(subprocess.run(["node", "-e", """
const s=require('fs').readFileSync(process.argv[1],'utf8');
const m=(n)=>{const i=s.indexOf('export const '+n);const j=s.indexOf('=',i);let k=s.indexOf('\\n};',j);return eval('('+s.slice(j+1,k+3).replace(/:\\s*Record<[^>]*>/,'').trim().replace(/;$/,'')+')')};
console.log(JSON.stringify({BODY:m('BODY_CLIPS'),HOOK:m('HOOK_CLIP')}))""", str(ROOT / "src/config.ts")], capture_output=True, text=True, check=True).stdout)
    k = f"b{b}"
    return sorted({c for sc in cfg["BODY"][k] for c in sc} | {cfg["HOOK"][k][h - 1]})


def main():
    for b in (1, 2, 3):
        for h in range(1, 6):
            used = clips_for(b, h)
            out = ROOT / f"out/Body {b} Hook {h} - bron.zip"
            with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
                for p in ["package.json", "tsconfig.json", "remotion.config.ts", ".gitignore", "README-bron.md"]:
                    if (ROOT / p).exists(): z.write(ROOT / p, p)
                z.write(ROOT.parent / "package-lock.json", "package-lock.json")
                for d in ["src", "scripts"]:
                    for f in (ROOT / d).rglob("*"):
                        if f.is_file() and "tts-cache" not in str(f) and "__pycache__" not in str(f):
                            z.write(f, f.relative_to(ROOT))
                for f in list((ROOT / "public/fonts").glob("*")) + list((ROOT / "public/logo").glob("*")) + list((ROOT / "public/muziek").glob("*")):
                    z.write(f, f.relative_to(ROOT))
                for n in (f"b{b}-body.mp3", f"b{b}-h{h}.mp3"):
                    z.write(ROOT / "public/vo" / n, f"public/vo/{n}")
                for c in used:
                    z.write(ARCH / f"{c}.mp4", f"public/clips/{c}.mp4")
                    z.write(PORT / f"{c.replace('.', '-')}.png" if (PORT / f"{c.replace('.', '-')}.png").exists() else PORT / f"{c}.png", f"startframes/{c}.png")
            print(out.name, out.stat().st_size // 1_000_000, "MB", flush=True)


if __name__ == "__main__":
    main()

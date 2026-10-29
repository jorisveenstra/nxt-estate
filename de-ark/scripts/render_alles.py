"""Rendert de 3 bodies en 15 hooks (stil, zonder audio) met twee parallelle Remotion-processen."""
import subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CH = "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome"
(ROOT / "out").mkdir(exist_ok=True)
jobs = [f"BodyDeel{b}" for b in (1, 2, 3)] + [f"HookB{b}H{h}" for b in (1, 2, 3) for h in range(1, 6)]


def render(comp):
    uit = ROOT / f"out/{comp}.mp4"
    if uit.exists() and uit.stat().st_size > 10000:
        return comp
    r = subprocess.run(["npx", "remotion", "render", "src/index.ts", comp, str(uit), f"--browser-executable={CH}", "--concurrency=4", "--crf=24", "--muted", "--pixel-format=yuv420p"],
                       cwd=ROOT, capture_output=True, text=True)
    print(comp, "ok" if r.returncode == 0 else "FOUT\n" + r.stdout[-400:] + r.stderr[-400:], flush=True)
    return comp


with ThreadPoolExecutor(2) as ex:
    list(ex.map(render, jobs))

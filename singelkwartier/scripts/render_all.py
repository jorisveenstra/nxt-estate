"""Rendert 2 bodies + 10 hooks (1080x1920), plakt met ffmpeg -c copy en voegt audiomix toe -> out/final/."""
import subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"; (OUT / "final").mkdir(parents=True, exist_ok=True)
BR = "/opt/pw-browsers/chromium"
def render(comp):
    f = OUT / f"{comp}.mp4"
    if not f.exists():
        subprocess.run(["npx", "remotion", "render", comp, str(f), f"--browser-executable={BR}", "--concurrency=4", "--codec=h264", "--crf=24"], cwd=ROOT, check=True, stdout=subprocess.DEVNULL)
    return f
comps = ["Body1", "Body2"] + [f"Hook{b}-{h}" for b in (1, 2) for h in range(1, 6)]
with ThreadPoolExecutor(1) as ex:
    list(ex.map(render, comps))
for b in (1, 2):
    for h in range(1, 6):
        lst = OUT / f"list-{b}-{h}.txt"
        lst.write_text(f"file '{OUT}/Hook{b}-{h}.mp4'\nfile '{OUT}/Body{b}.mp4'\n")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-i", str(ROOT / f"public/audio/b{b}h{h}.m4a"),
            "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-shortest", "-movflags", "+faststart", str(OUT / f"final/Body{b}Hook{h}.mp4")], check=True)
        print("klaar", b, h)

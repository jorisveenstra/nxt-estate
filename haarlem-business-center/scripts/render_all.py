"""
Rendert alle 15 video's (9:16, 1080x1920): elke body één keer, elke hook apart, daarna
ffmpeg -c copy (hook + body) en de audiomix (voice-over eleven_v4 + muziek met ducking).
Gebruik: BROWSER=/pad/naar/chrome python3 scripts/render_all.py
"""
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
OUT.mkdir(exist_ok=True)
BROWSER = os.environ.get("BROWSER", "")
TIM = json.loads((ROOT / "src/timing.json").read_text())
BODIES = {1: 5, 2: 5, 3: 5}


def render(comp, dest):
    if dest.exists():
        return
    cmd = ["npx", "remotion", "render", comp, str(dest), "--muted", "--concurrency=2", "--codec=h264", "--crf=24", "--pixel-format=yuv420p"]
    if BROWSER:
        cmd += ["--browser-executable=" + BROWSER, "--chrome-mode=chrome-for-testing"]
    subprocess.run(cmd, cwd=ROOT, check=True, stdout=subprocess.DEVNULL)


def join(b, h):
    name = f"HBC-Body{b}-Hook{h}"
    final = OUT / f"{name}.mp4"
    if final.exists():
        return
    lst = OUT / f"{name}.txt"
    lst.write_text(f"file '{OUT / f'hook{b}-{h}.mp4'}'\nfile '{OUT / f'body{b}.mp4'}'\n")
    raw = OUT / f"{name}.raw.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(raw)], check=True)
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(raw)], capture_output=True, text=True).stdout)
    fc = (f"[1:a]volume=0.30,afade=t=in:d=1.2,afade=t=out:st={dur-2.4:.2f}:d=2.4,atrim=0:{dur:.2f}[m];"
          f"[0:a]apad=whole_dur={dur:.2f},asplit=2[v][sc];"
          f"[m][sc]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=450[md];"
          f"[v][md]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(ROOT / f"public/vo/b{b}h{h}.wav"), "-i", str(ROOT / "public/music/music.mp3"),
                    "-i", str(raw), "-filter_complex", fc, "-map", "2:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-t", f"{dur:.3f}", "-movflags", "+faststart", str(final)], check=True)
    raw.unlink(); lst.unlink()
    print("klaar", final.name, flush=True)


def main():
    jobs = [(f"Body{b}", OUT / f"body{b}.mp4") for b in BODIES]
    jobs += [(f"Hook{b}-{h}", OUT / f"hook{b}-{h}.mp4") for b, n in BODIES.items() for h in range(1, n + 1)]
    with ThreadPoolExecutor(2) as ex:
        list(ex.map(lambda j: render(*j), jobs))
    for b, n in BODIES.items():
        for h in range(1, n + 1):
            join(b, h)


if __name__ == "__main__":
    main()

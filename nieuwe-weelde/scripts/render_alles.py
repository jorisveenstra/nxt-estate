"""Rendert alle 15 video's (3 bodies x 5 hooks), 1080x1920 (9:16).

1. Bundel één keer en render per body één Body<b>-segment (body + CTA) en per hook één Hook<b>-<h>-segment (2 renders tegelijk).
2. Plak hook + body met harde cut aan elkaar (ffmpeg concat, -c copy op de video; beide segmenten hebben identieke codec-instellingen).
3. Audio: voice-over (hook + body) + uplifting muziekstem met ducking (sidechain), fades en limiter; video blijft gekopieerd.
Gebruik: python3 scripts/render_alles.py [body ...]
"""
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CH = "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome"
SEG = ROOT / "out/seg"
FIN = ROOT / "out/final"
MUZIEK = ROOT / "public/muziek/nieuwe-weelde-uplifting.mp3"
TAIL = 1.8


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, cwd=ROOT, **kw)


def render(comp):
    uit = SEG / f"{comp}.mp4"
    if uit.exists():
        return
    run(["npx", "remotion", "render", "src/index.ts", comp, str(uit), f"--browser-executable={CH}", "--concurrency=2", "--log=error"])
    print("klaar", comp, flush=True)


def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], text=True))


def mix(b, h):
    n = f"Body-{b}-Hook-{h}"
    uit = FIN / f"{n}.mp4"
    lst = SEG / f"{n}.txt"
    lst.write_text(f"file '{(SEG / f'Hook{b}-{h}.mp4').as_posix()}'\nfile '{(SEG / f'Body{b}.mp4').as_posix()}'\n")
    video = SEG / f"{n}-video.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-an", "-c:v", "copy", str(video)])
    total = dur(video)
    fc = (
        "[0:a][1:a]concat=n=2:v=0:a=1,apad[vo];[vo]asplit=2[vo1][vo2];"
        f"[2:a]volume=0.55,afade=t=in:st=0:d=0.8,afade=t=out:st={total - 1.6:.2f}:d=1.6[mus];"
        "[mus][vo1]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=450[duck];"
        "[vo2][duck]amix=inputs=2:weights='1 1':normalize=0:duration=first,alimiter=limit=0.95[a]"
    )
    run(["ffmpeg", "-v", "error", "-y", "-i", str(ROOT / f"public/vo/hook{b}-{h}.wav"), "-i", str(ROOT / f"public/vo/body{b}.wav"), "-i", str(MUZIEK), "-i", str(video),
         "-filter_complex", fc, "-map", "3:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{total:.3f}", "-movflags", "+faststart", str(uit)])
    video.unlink()
    print("gemixt", n, round(total, 1), "s", round(uit.stat().st_size / 1e6, 1), "MB", flush=True)


def main():
    bodies = [int(x) for x in sys.argv[1:]] or [1, 2, 3]
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    SEG.mkdir(parents=True, exist_ok=True)
    FIN.mkdir(parents=True, exist_ok=True)
    comps = [f"Body{b}" for b in bodies] + [f"Hook{b}-{h}" for b in bodies for h in range(1, len(scripts[f"b{b}"]["hooks"]) + 1)]
    with ThreadPoolExecutor(2) as ex:
        list(ex.map(render, comps))
    for b in bodies:
        for h in range(1, len(scripts[f"b{b}"]["hooks"]) + 1):
            mix(b, h)


if __name__ == "__main__":
    main()

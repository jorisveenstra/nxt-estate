"""Rendert per body één body-deel en per hook één hook-deel (stil, 1080x1920), zet ze met ffmpeg -c copy aan elkaar
en mixt voice-over (eleven_v4) + muziek (gedempt onder de stem) erbij. Resultaat: out/final/Body <b> Hook <h>.mp4
Gebruik: python3 scripts/render_alles.py [browser-executable]"""
import json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
PARTS, FINAL = ROOT / "out/parts", ROOT / "out/final"
PARTS.mkdir(parents=True, exist_ok=True); FINAL.mkdir(parents=True, exist_ok=True)
BROWSER = sys.argv[1] if len(sys.argv) > 1 else "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"
timing = json.loads((ROOT / "src/timing.json").read_text())
BODIES = sorted({int(k[1]) for k in timing})
HOOKS = {b: sorted(int(k.split("h")[1]) for k in timing if k.startswith(f"b{b}h")) for b in BODIES}


def render(comp):
    uit = PARTS / f"{comp}.mp4"
    if not uit.exists():
        subprocess.run(["npx", "remotion", "render", "src/index.ts", comp, str(uit), "--concurrency=2", f"--browser-executable={BROWSER}", "--crf=24"], cwd=ROOT, check=True, capture_output=True)
    print("gerenderd", comp, flush=True)


def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]))


def mux(b, h):
    uit = FINAL / f"Body {b} Hook {h}.mp4"
    lijst = PARTS / f"lijst-{b}-{h}.txt"
    lijst.write_text(f"file '{PARTS / f'Hook{b}-{h}.mp4'}'\nfile '{PARTS / f'Body{b}.mp4'}'\n")
    video = PARTS / f"video-{b}-{h}.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lijst), "-c", "copy", str(video)], check=True)
    d = dur(video)
    fc = (f"[1:a]volume=0.20,afade=t=in:d=1.0,afade=t=out:st={d-2.5:.2f}:d=2.5[m];"
          f"[0:a]asplit=2[vo][sc];[m][sc]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=450[duck];"
          f"[vo][duck]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95,apad[a]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(ROOT / f"public/vo/b{b}h{h}.wav"), "-stream_loop", "-1", "-i", str(ROOT / "public/muziek/ace-opgewekt.mp3"),
                    "-i", str(video), "-filter_complex", fc, "-map", "2:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{d:.3f}", "-movflags", "+faststart", str(uit)], check=True)
    print("klaar", uit.name, flush=True)


if __name__ == "__main__":
    comps = [f"Body{b}" for b in BODIES] + [f"Hook{b}-{h}" for b in BODIES for h in HOOKS[b]]
    with ThreadPoolExecutor(2) as ex:
        list(ex.map(render, comps))
    for b in BODIES:
        for h in HOOKS[b]:
            mux(b, h)

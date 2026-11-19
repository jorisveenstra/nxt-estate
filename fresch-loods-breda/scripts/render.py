"""
Snelle render: elke body één keer (Body-b1, Body-b2), elke hook apart (Hook-b1-h1 ...), stil gerenderd.
Daarna per video: ffmpeg concat -c copy (zelfde codec/instellingen) + audio public/vo/b<b>h<h>.wav (AAC),
faststart. Valt stream-copy af (ffprobe-fout/duurverschil), dan wordt de join opnieuw gecodeerd.

Gebruik: python3 scripts/render.py   (CHROME=<pad naar chrome-headless-shell> optioneel)
"""
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
SEG = OUT / "seg"
CHROME = os.environ.get("CHROME", "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell")
TIMING = json.loads((ROOT / "src/timing.json").read_text())


def render(comp):
    uit = SEG / f"{comp}.mp4"
    if uit.exists():
        return uit
    tmp = SEG / f"{comp}.part.mp4"
    subprocess.run(["npx", "remotion", "render", comp, str(tmp), "--muted", "--codec=h264", "--crf=24",
                    "--pixel-format=yuv420p", "--concurrency=2", f"--browser-executable={CHROME}", "--log=error"],
                   cwd=ROOT, check=True)
    tmp.replace(uit)
    print("gerenderd", comp, flush=True)
    return uit


def probe(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,sample_aspect_ratio:format=duration",
                        "-of", "json", str(p)], capture_output=True, text=True)
    return json.loads(r.stdout) if r.returncode == 0 else None


def join(b, h):
    k = f"{b}h{h}"
    uit = OUT / f"Body {b[1:]} Hook {h}.mp4"
    lijst = SEG / f"{k}.txt"
    lijst.write_text(f"file '{SEG / f'Hook-{b}-h{h}.mp4'}'\nfile '{SEG / f'Body-{b}.mp4'}'\n")
    verwacht = (TIMING[k]["frames"] + TIMING[b]["frames"]) / 30
    wav = ROOT / f"public/vo/{k}.wav"
    basis = ["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lijst), "-i", str(wav), "-map", "0:v", "-map", "1:a"]
    eind = ["-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", "-shortest", str(uit)]
    subprocess.run(basis + ["-c:v", "copy"] + eind, check=True)
    p = probe(uit)
    if not p or abs(float(p["format"]["duration"]) - verwacht) > 0.15:
        print(k, "stream-copy afwijkend, opnieuw coderen", flush=True)
        subprocess.run(basis + ["-c:v", "libx264", "-crf", "24", "-preset", "medium", "-pix_fmt", "yuv420p"] + eind, check=True)
        p = probe(uit)
    print(k, "->", uit.name, p["format"]["duration"], flush=True)
    return uit


def main():
    SEG.mkdir(parents=True, exist_ok=True)
    comps = ["Body-b1", "Body-b2"] + [f"Hook-b{b}-h{h}" for b in (1, 2) for h in range(1, 6)]
    with ThreadPoolExecutor(2) as pool:
        list(pool.map(render, comps))
    for b in ("b1", "b2"):
        for h in range(1, 6):
            join(b, h)


if __name__ == "__main__":
    main()

"""
Rendert alle varianten efficiënt: elke body één keer (Body-B<n>), elke hook apart (Hook-B<n>-H<h>),
beide zonder audio en met identieke encoderinstellingen; daarna per variant hook + body met
ffmpeg -c copy aan elkaar en de gemixte audio (public/mix) erbij. Controle met ffprobe.

Gebruik: CHROME=/pad/naar/chrome-headless-shell python3 scripts/render.py [b1_h1 ...]
Uitvoer: out/Body <n> Hook <h>.mp4 (1080x1920, H.264, AAC, faststart)
"""
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLAN = json.loads((ROOT / "src/plan.json").read_text())
OUT = ROOT / "out"
SEG = OUT / "segmenten"
BUNDLE = OUT / "bundle"
CHROME = os.environ.get("CHROME")
CRF = os.environ.get("CRF", "23")


def run(cmd):
    subprocess.run(cmd, check=True, cwd=ROOT)


def render(comp, uit):
    if uit.exists():
        return
    tmp = uit.with_suffix(".tmp.mp4")
    cmd = ["npx", "remotion", "render", str(BUNDLE), comp, str(tmp), "--muted", "--codec=h264", f"--crf={CRF}",
           "--pixel-format=yuv420p", "--concurrency=3", "--log=error", "--x264-preset=medium",
           "--offthreadvideo-cache-size-in-bytes=1500000000"]
    if CHROME:
        cmd.append(f"--browser-executable={CHROME}")
    run(cmd)
    tmp.rename(uit)
    print("gerenderd", comp, flush=True)


def probe(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                        "stream=codec_type,codec_name,width,height,sample_aspect_ratio,r_frame_rate:stream_side_data=rotation:format=duration,size",
                        "-of", "json", str(p)], capture_output=True, text=True, check=True)
    return json.loads(r.stdout)


def samen(key):
    b, h = key.split("_h")
    n = b[1:]
    uit = OUT / f"Body {n} Hook {h}.mp4"
    lijst = SEG / f"{key}.txt"
    lijst.write_text(f"file '{SEG / f'hook_{key}.mp4'}'\nfile '{SEG / f'body_{b}.mp4'}'\n")
    video = SEG / f"{key}_video.mp4"
    run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lijst), "-c", "copy", str(video)])
    frames = PLAN["hooks"][key]["frames"] + PLAN["bodies"][b]["frames"]
    d = float(probe(video)["format"]["duration"])
    if abs(d - frames / 30) > 0.1:  # stream-copy mislukt -> opnieuw encoderen
        run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lijst), "-c:v", "libx264",
             "-crf", CRF, "-preset", "medium", "-pix_fmt", "yuv420p", str(video)])
    run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(video), "-i", str(ROOT / f"public/mix/{key}.wav"),
         "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
         "-t", f"{frames / 30:.3f}", "-movflags", "+faststart", str(uit)])
    info = probe(uit)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    a = [s for s in info["streams"] if s["codec_type"] == "audio"]
    assert (v["width"], v["height"]) == (1080, 1920), f"{uit.name}: {v['width']}x{v['height']}"
    assert v.get("sample_aspect_ratio", "1:1") in ("1:1", "N/A") and not any(float(d.get("rotation", 0)) for d in v.get("side_data_list", [])), uit.name
    assert a and abs(float(info["format"]["duration"]) - frames / 30) < 0.15, uit.name
    print(f"klaar {uit.name}: {v['width']}x{v['height']} {float(info['format']['duration']):.2f}s "
          f"{int(info['format']['size']) / 1e6:.1f} MB", flush=True)


def main():
    SEG.mkdir(parents=True, exist_ok=True)
    keys = sys.argv[1:] or list(PLAN["hooks"])
    if not BUNDLE.exists():
        run(["npx", "remotion", "bundle", "src/index.ts", "--out-dir", str(BUNDLE), "--log=error"])
    run(["python3", "scripts/mix_audio.py", *keys])
    bodies = sorted({k.split("_h")[0] for k in keys})
    taken = [(f"Body-B{b[1:]}", SEG / f"body_{b}.mp4") for b in bodies]
    taken += [(f"Hook-B{k.split('_h')[0][1:]}-H{k.split('_h')[1]}", SEG / f"hook_{k}.mp4") for k in keys]
    # één render tegelijk (elk met 3 threads): begrensd geheugengebruik op 4 cores / 16 GB
    for t in taken:
        render(*t)
    for k in keys:
        samen(k)


if __name__ == "__main__":
    main()

"""
Eindrender: elke body één keer, elke hook apart (beeld, zonder audio), daarna per variant
hook + body plakken met ffmpeg -c copy en de audio mixen (voice-over + muziek met ducking).
Zelfde mix als de FullAd-compositie in Remotion Studio.

Gebruik: python3 scripts/render.py   (CHROME=<pad naar chromium> optioneel)
"""
import json
import math
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEG = ROOT / "seg"
OUT = ROOT / "out"
FPS = 30
PAUSE, TAIL = 0.35, 1.6
CHROME = os.environ.get("CHROME", "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell")
timing = json.loads((ROOT / "src/timing.json").read_text())


def hook_frames(b, h):
    return math.ceil((timing[f"b{b}"]["hooks"][str(h)]["end"] + PAUSE) * FPS)


def body_frames(b):
    return math.ceil((timing[f"b{b}"]["end"] + TAIL) * FPS)


def render(comp, out):
    if out.exists():
        return
    tmp = out.with_suffix(".tmp.mp4")
    subprocess.run(["npx", "remotion", "render", "src/index.ts", comp, str(tmp), "--muted", "--crf=24",
                    "--concurrency=2", "--offthreadvideo-cache-size-in-bytes=400000000", "--offthreadvideo-video-threads=2", f"--browser-executable={CHROME}", "--log=error"], cwd=ROOT, check=True)
    tmp.rename(out)
    print("klaar:", comp, flush=True)


def probe(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,sample_aspect_ratio:format=duration",
                        "-of", "json", str(p)], capture_output=True, text=True, check=True)
    return json.loads(r.stdout)


def assemble(b, h):
    final = OUT / f"Body {b} Hook {h}.mp4"
    if final.exists():
        return final
    hf = hook_frames(b, h)
    total = (hf + body_frames(b)) / FPS
    lst = SEG / f"list-b{b}h{h}.txt"
    lst.write_text(f"file 'hook-b{b}-h{h}.mp4'\nfile 'body-b{b}.mp4'\n")
    joined = SEG / f"joined-b{b}h{h}.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(joined)], check=True)
    d = float(probe(joined)["format"]["duration"])
    if abs(d - total) > 0.15:  # stream-copy mislukt: opnieuw encoderen
        print("concat-duur wijkt af, opnieuw encoderen", b, h, d, total)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c:v", "libx264", "-crf", "24",
                        "-pix_fmt", "yuv420p", str(joined)], check=True)
    delay = int(round(hf / FPS * 1000))
    fade_out = max(0, total - 1.5)
    filt = (
        f"[1:a]aresample=48000,aformat=channel_layouts=stereo[hk];"
        f"[2:a]aresample=48000,aformat=channel_layouts=stereo,adelay={delay}|{delay}[bd];"
        f"[hk][bd]amix=inputs=2:normalize=0:duration=longest,apad=whole_dur={total:.3f},asplit=2[vo][sc];"
        f"[3:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{total:.3f},volume=0.22,"
        f"afade=t=in:d=0.5,afade=t=out:st={fade_out:.3f}:d=1.5[mu];"
        f"[mu][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[duck];"
        f"[vo][duck]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[a]"
    )
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(joined), "-i", str(ROOT / f"public/vo/b{b}h{h}-hook.mp3"),
                    "-i", str(ROOT / f"public/vo/b{b}-body.mp3"), "-i", str(ROOT / "public/music/muziek.mp3"),
                    "-filter_complex", filt, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-t", f"{total:.3f}", "-movflags", "+faststart", str(final)], check=True)
    info = probe(final)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    assert (v["width"], v["height"]) == (1080, 1920), v
    assert any(s["codec_type"] == "audio" for s in info["streams"])
    print(f"{final.name}: {v['width']}x{v['height']} {float(info['format']['duration']):.2f}s {final.stat().st_size/1e6:.1f} MB", flush=True)
    return final


def main():
    SEG.mkdir(exist_ok=True)
    OUT.mkdir(exist_ok=True)
    jobs = [(f"Body-b{b}", SEG / f"body-b{b}.mp4") for b in (1, 2, 3)]
    jobs += [(f"Hook-b{b}-h{h}", SEG / f"hook-b{b}-h{h}.mp4") for b in (1, 2, 3) for h in range(1, 6)]
    with ThreadPoolExecutor(2) as ex:
        list(ex.map(lambda j: render(*j), jobs))
    for b in (1, 2, 3):
        for h in range(1, 6):
            assemble(b, h)


if __name__ == "__main__":
    main()

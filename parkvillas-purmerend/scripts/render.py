"""
Rendert alle 15 video's efficiënt:
 1. bundelt het Remotion-project één keer (build/)
 2. rendert per body het body-segment één keer en per hook alleen het hook-segment (zonder audio)
 3. plakt hook + body met ffmpeg -c copy aan elkaar en mixt de audio: hook-vo, body-vo op de knip,
    muziekbed eronder met ducking, korte fades; loudnorm -14 LUFS; faststart.
 4. controleert elke mp4 met ffprobe (1080x1920, SAR 1:1, geen rotatie).
Gebruik: python3 scripts/render.py [b1h1 ...]
"""
import json, subprocess, sys, shutil
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
SEG = OUT / "seg"
FPS = 30
CHROME = next((p for p in ["/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell"] if Path(p).exists()), None)
T = json.loads((ROOT / "src/timing.json").read_text())


def run(cmd):
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(f"{cmd[:4]}…\n{r.stderr[-3000:]}\n{r.stdout[-2000:]}")
    return r.stdout


def render(comp, out):
    if out.exists():
        return out
    cmd = ["npx", "remotion", "render", "build", comp, str(out), "--muted", "--concurrency", "2", "--crf", "24",
           "--pixel-format", "yuv420p", "--codec", "h264", "--offthreadvideo-cache-size-in-bytes", "1500000000"]
    if CHROME:
        cmd += ["--browser-executable", CHROME]
    tmp = out.with_suffix(".tmp.mp4")
    run(cmd[:5] + [str(tmp)] + cmd[6:])
    tmp.rename(out)
    return out


def probe(p):
    s = json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(p)]))
    v = next(x for x in s["streams"] if x["codec_type"] == "video")
    rot = any(float(sd.get("rotation", 0)) for sd in v.get("side_data_list", []))
    return v["width"], v["height"], v.get("sample_aspect_ratio", "1:1"), rot, float(s["format"]["duration"]), [x["codec_type"] for x in s["streams"]]


def assemble(hid):
    b = hid[:2]
    final = OUT / f"Parkvillas-Purmerend-Body{hid[1]}-Hook{hid[3]}.mp4"
    hook_v, body_v = SEG / f"hook-{hid}.mp4", SEG / f"body-{b}.mp4"
    lst = SEG / f"concat-{hid}.txt"
    lst.write_text(f"file '{hook_v.name}'\nfile '{body_v.name}'\n")
    joined = SEG / f"joined-{hid}.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(joined)])
    hf, bf = T["hooks"][hid]["frames"], T["bodies"][b]["frames"]
    total = (hf + bf) / FPS
    jd = probe(joined)[4]
    if abs(jd - total) > 0.1:  # stream-copy mislukt -> opnieuw encoderen
        run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c:v", "libx264", "-crf", "22", "-pix_fmt", "yuv420p", str(joined)])
    delay = round(hf / FPS * 1000)
    fc = (f"[1:a]aresample=48000,aformat=channel_layouts=stereo[h];"
          f"[2:a]aresample=48000,aformat=channel_layouts=stereo,adelay={delay}|{delay}[bd];"
          f"[h][bd]amix=inputs=2:normalize=0,apad,atrim=0:{total:.3f}[vo];[vo]asplit[vo1][vo2];"
          f"[3:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{total:.3f},volume=0.30,"
          f"afade=t=in:d=0.4,afade=t=out:st={total - 1.6:.3f}:d=1.6[m];"
          f"[m][vo2]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[md];"
          f"[vo1][md]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]")
    run(["ffmpeg", "-v", "error", "-y", "-i", str(joined), "-i", f"public/vo/hook-{hid}.mp3", "-i", f"public/vo/body-{b}.mp3",
         "-i", "public/muziek/muziek.mp3", "-filter_complex", fc, "-map", "0:v", "-map", "[a]", "-c:v", "copy",
         "-c:a", "aac", "-b:a", "192k", "-t", f"{total:.3f}", "-movflags", "+faststart", str(final)])
    w, h, sar, rot, dur, kinds = probe(final)
    assert (w, h) == (1080, 1920) and sar in ("1:1", "N/A") and not rot and "audio" in kinds, (final, w, h, sar, rot, kinds)
    joined.unlink()
    return final, dur, final.stat().st_size


def main():
    ids = sys.argv[1:] or sorted(T["hooks"])
    SEG.mkdir(parents=True, exist_ok=True)
    run(["npx", "remotion", "bundle", "src/index.ts", "--out-dir", "build"])
    bodies = sorted({i[:2] for i in ids})
    jobs = [(f"Body-{b}", SEG / f"body-{b}.mp4") for b in bodies] + [(f"Hook-{i}", SEG / f"hook-{i}.mp4") for i in ids]
    with ThreadPoolExecutor(2) as ex:
        list(ex.map(lambda j: render(*j), jobs))
    for i in ids:
        f, d, s = assemble(i)
        print(f.name, f"{d:.1f}s", f"{s / 1e6:.1f}MB", flush=True)


if __name__ == "__main__":
    main()

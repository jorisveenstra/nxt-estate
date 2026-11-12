"""
Rendert en monteert alle 15 video's (Body b Hook h).

1. Remotion rendert elke body één keer en elke hook los (zonder audio, CRF 24, 1080x1920, 30 fps),
   maximaal twee renders tegelijk.
2. Per video: hook + body met ffmpeg concat -c copy (zelfde codec/instellingen, IDR aan het begin).
3. Audio: hook-VO + pauze + body-VO (exact op de frame-grenzen), muziekbed van de body eronder met
   sidechain-ducking en fades, loudnorm; AAC gemuxt, +faststart.
4. ffprobe-controle: 1080x1920, SAR 1:1, geen rotatie, audio aanwezig, duur klopt.

Chromium: CHROME=/pad/naar/chrome-headless-shell (anders Remotion-standaard).
"""
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
SEG = OUT / "segments"
FIN = OUT / "final"
FPS = 30
PAUSE, TAIL = 0.35, 1.6
VO = json.loads((ROOT / "src/vo.json").read_text())


def run(cmd):
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(f"{cmd[:4]} faalde:\n{r.stderr[-2000:]}\n{r.stdout[-1500:]}")
    return r.stdout


def render(comp):
    dst = SEG / f"{comp}.mp4"
    if dst.exists():
        return
    tmp = SEG / f"{comp}.tmp.mp4"
    cmd = ["npx", "remotion", "render", "src/index.ts", comp, str(tmp), "--muted", "--crf=24", "--concurrency=2", "--log=error"]
    if os.environ.get("CHROME"):
        cmd.append(f"--browser-executable={os.environ['CHROME']}")
    run(cmd)
    tmp.rename(dst)
    print("gerenderd", comp, flush=True)


def frames(sec):
    import math
    return math.ceil(sec * FPS)


def probe(p):
    return json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(p)]))


def build(b, h):
    name = f"Body {b} Hook {h}"
    dst = FIN / f"Elbe 23 Den Haag - {name}.mp4"
    if dst.exists():
        return dst
    hook, body = SEG / f"Body{b}-Hook{h}-hook.mp4", SEG / f"Body{b}.mp4"
    hf, bf = frames(VO[f"b{b}h{h}"]["duur"] + PAUSE), frames(VO[f"body{b}"]["duur"] + TAIL)
    hs, bs, total = hf / FPS, bf / FPS, (hf + bf) / FPS
    lst = SEG / f"b{b}h{h}.txt"
    lst.write_text(f"file '{hook.name}'\nfile '{body.name}'\n")
    vid = SEG / f"b{b}h{h}-video.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(vid)])
    nf = int(probe(vid)["streams"][0].get("nb_frames", 0))
    if nf != hf + bf:  # stream-copy niet frame-exact -> opnieuw encoderen
        run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c:v", "libx264", "-crf", "24",
             "-pix_fmt", "yuv420p", "-r", "30", str(vid)])
    aud = SEG / f"b{b}h{h}-audio.wav"
    fc = (f"[0:a]aresample=48000,apad,atrim=0:{hs:.4f}[h];"
          f"[1:a]aresample=48000,apad,atrim=0:{bs:.4f}[bd];"
          f"[h][bd]concat=n=2:v=0:a=1,asplit=2[v1][v2];"
          f"[2:a]aresample=48000,atrim=0:{total:.4f},volume=0.30,afade=t=in:d=0.4,afade=t=out:st={total-1.6:.3f}:d=1.6[m];"
          f"[m][v1]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[md];"
          f"[v2][md]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[out]")
    run(["ffmpeg", "-v", "error", "-y", "-i", str(ROOT / f"public/vo/b{b}h{h}.mp3"), "-i", str(ROOT / f"public/vo/body{b}.mp3"),
         "-i", str(ROOT / f"public/music/body{b}.mp3"), "-filter_complex", fc, "-map", "[out]", "-t", f"{total:.4f}", str(aud)])
    tmp = FIN / f"tmp-b{b}h{h}.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-i", str(vid), "-i", str(aud), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac",
         "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(tmp)])
    info = probe(tmp)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    a = [s for s in info["streams"] if s["codec_type"] == "audio"]
    dur = float(info["format"]["duration"])
    rot = any(float(sd.get("rotation", 0)) for sd in v.get("side_data_list", [])) or v.get("tags", {}).get("rotate")
    ok = v["width"] == 1080 and v["height"] == 1920 and v.get("sample_aspect_ratio", "1:1") in ("1:1", "N/A") and not rot and a and abs(dur - total) < 0.15
    if not ok:
        raise RuntimeError(f"{name}: controle mislukt {v['width']}x{v['height']} sar={v.get('sample_aspect_ratio')} dur={dur} total={total}")
    tmp.rename(dst)
    print(f"klaar {name}: {dur:.2f}s {dst.stat().st_size/1e6:.1f} MB", flush=True)
    return dst


def main():
    SEG.mkdir(parents=True, exist_ok=True)
    FIN.mkdir(parents=True, exist_ok=True)
    comps = [f"Body{b}" for b in (1, 2, 3)] + [f"Body{b}-Hook{h}-hook" for b in (1, 2, 3) for h in range(1, 6)]
    with ThreadPoolExecutor(2) as ex:
        list(ex.map(render, comps))
    with ThreadPoolExecutor(3) as ex:
        list(ex.map(lambda bh: build(*bh), [(b, h) for b in (1, 2, 3) for h in range(1, 6)]))


if __name__ == "__main__":
    main()

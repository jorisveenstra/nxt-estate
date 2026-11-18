"""
Rendert en monteert alle varianten (Body b Hook h), staand 1080x1920.

1. Remotion-bundle één keer; elke body één keer renderen (Body<b>) en elke hook los (Hook-B<b>-H<h>),
   zonder audio, h264 CRF 24, twee renders tegelijk met elk concurrency 2 (4 cores).
2. Per variant: hook + body met ffmpeg concat -c copy (zelfde codec/instellingen, keyframe aan het begin
   van elk segment); valt dat niet goed uit, dan wordt de las opnieuw gecodeerd.
3. Audio: hook-VO (precies hookFrames lang) + body-VO, muziekbed (ElevenLabs Music) eronder met
   sidechain-ducking, korte fades en limiter. Muxen met +faststart.
4. Controle met ffprobe: 1080x1920, SAR 1:1, geen rotatie, duur klopt.

Gebruik: python3 scripts/monteer.py [--alleen b1h1 ...]
"""
import json, os, shutil, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
SEG = OUT / "segmenten"
FPS = 30
CRF = "24"


def chrome():
    for p in [os.environ.get("REMOTION_BROWSER"), "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell"]:
        if p and Path(p).exists():
            return p
    return None


def sh(cmd, **kw):
    return subprocess.run(cmd, check=True, **kw)


def probe(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(p)],
                       capture_output=True, text=True, check=True)
    return json.loads(r.stdout)


def render(bundle, comp, out):
    if out.exists() and out.stat().st_size > 1000:
        return out
    tmp = out.with_suffix(".part.mp4")
    cmd = ["npx", "remotion", "render", str(bundle), comp, str(tmp), "--codec=h264", f"--crf={CRF}", "--muted",
           "--concurrency=2", "--offthreadvideo-cache-size-in-bytes=800000000", "--log=error", "--image-format=jpeg", "--jpeg-quality=92"]
    if chrome():
        cmd.append(f"--browser-executable={chrome()}")
    sh(cmd, cwd=ROOT)
    tmp.rename(out)
    return out


def check_video(p, frames=None):
    info = probe(p)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    rot = any(float(sd.get("rotation", 0)) for sd in v.get("side_data_list", [])) or float(v.get("tags", {}).get("rotate", 0))
    ok = v["width"] == 1080 and v["height"] == 1920 and v.get("sample_aspect_ratio", "1:1") in ("1:1", "N/A") and not rot
    if frames is not None:
        nb = int(v.get("nb_frames", 0))
        ok = ok and abs(nb - frames) <= 1
    return ok, info


def main():
    timing = json.loads((ROOT / "src/timing.json").read_text())
    alleen = sys.argv[sys.argv.index("--alleen") + 1:] if "--alleen" in sys.argv else None
    variants = [f"b{b}h{h}" for b in (1, 2, 3) for h in range(1, 6)]
    if alleen:
        variants = [v for v in variants if v in alleen]
    SEG.mkdir(parents=True, exist_ok=True)
    bundle = OUT / "bundle"
    if not (bundle / "index.html").exists():
        sh(["npx", "remotion", "bundle", "src/index.ts", f"--out-dir={bundle}", "--log=error"], cwd=ROOT)
    jobs = sorted({f"Body{v[1]}" for v in variants}) + [f"Hook-B{v[1]}-H{v[3]}" for v in variants]
    with ThreadPoolExecutor(2) as ex:
        list(ex.map(lambda c: render(bundle, c, SEG / f"{c}.mp4"), jobs))
    for c in jobs:
        key = f"b{c[4]}" if c.startswith("Body") else f"b{c[6]}h{c[9]}"
        ok, _ = check_video(SEG / f"{c}.mp4", timing[key]["frames"])
        if not ok:
            raise SystemExit(f"Segment {c} heeft verkeerde geometrie/lengte")
    muziek = ROOT / "public/muziek/bed.mp3"
    for v in variants:
        b, h = v[1], v[3]
        hf, bf = timing[v]["frames"], timing[f"b{b}"]["frames"]
        total = (hf + bf) / FPS
        final = OUT / f"Body {b} Hook {h}.mp4"
        lijst = SEG / f"{v}.txt"
        lijst.write_text(f"file 'Hook-B{b}-H{h}.mp4'\nfile 'Body{b}.mp4'\n")
        vid = SEG / f"{v}-video.mp4"
        sh(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lijst), "-c", "copy", str(vid)])
        ok, _ = check_video(vid, hf + bf)
        if not ok:
            print(v, "stream-copy las niet goed, opnieuw coderen")
            sh(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lijst), "-c:v", "libx264", "-crf", CRF,
                "-pix_fmt", "yuv420p", str(vid)])
        fade_out = max(0, total - 1.6)
        filt = (
            f"[0:a][1:a]concat=n=2:v=0:a=1,apad=whole_dur={total},atrim=0:{total},loudnorm=I=-15:TP=-1.5:LRA=9,aresample=48000,asplit=2[vo][sc];"
            f"[2:a]atrim=0:{total},asetpts=N/SR/TB,volume=0.30,afade=t=in:d=0.4,afade=t=out:st={fade_out}:d=1.6,aresample=48000[m];"
            f"[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[md];"
            f"[vo][md]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.89[a]"
        )
        sh(["ffmpeg", "-v", "error", "-y", "-i", str(ROOT / f"public/vo/b{b}h{h}-hook.wav"), "-i", str(ROOT / f"public/vo/b{b}-body.wav"),
            "-i", str(muziek), "-i", str(vid), "-filter_complex", filt, "-map", "3:v", "-map", "[a]", "-c:v", "copy",
            "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-t", f"{total}", "-movflags", "+faststart", str(final)])
        ok, info = check_video(final)
        size = final.stat().st_size
        print(f"{final.name}: {'OK' if ok else 'FOUT'} {float(info['format']['duration']):.2f}s {size / 1e6:.1f} MB", flush=True)
        if not ok or size > 250_000_000:
            raise SystemExit(f"{final.name} voldoet niet")


if __name__ == "__main__":
    main()

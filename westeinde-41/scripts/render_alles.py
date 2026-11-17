"""
Rendert alle 15 video's (3 bodies x 5 hooks), staand 1080x1920.

1. Bundelt het Remotion-project één keer (build/).
2. Rendert elk body-segment één keer en elk hook-segment apart (zonder audio), max. 2 renders tegelijk.
3. Plakt hook + body met ffmpeg -c copy (zelfde codec/instellingen; terugval: her-encode).
4. Mixt voice-over (hook + pauze + body) met het muziekbed (zacht, gedukt onder de stem, fade in/uit).
5. Controleert met ffprobe: 1080x1920, SAR 1:1, geen rotatie, faststart.

Uitvoer: out/westeinde41-body<B>-hook<H>.mp4
Gebruik: python3 scripts/render_alles.py [b1h1 ...]   (CHROMIUM=<pad> om de browser te kiezen)
"""
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
SEG = OUT / "segmenten"
FPS = 30
PAUZE = 0.45
STAART = 1.0
CRF = os.environ.get("CRF", "23")
BROWSER = os.environ.get("CHROMIUM") or next((p for p in [
    "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell",
    "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome"] if Path(p).exists()), None)
T = json.loads((ROOT / "src/timing.json").read_text())


def run(cmd, **kw):
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        raise RuntimeError(f"{cmd[:4]}... faalde:\n{r.stdout[-1500:]}\n{r.stderr[-2500:]}")
    return r.stdout


def frames_hook(b, h):
    import math
    return math.ceil((T[b]["hooks"][str(h)]["duur"] + PAUZE) * FPS)


def frames_body(b):
    import math
    return math.ceil((T[b]["body"]["duur"] + STAART) * FPS)


def render(comp, uit):
    if uit.exists():
        return uit
    tmp = uit.with_suffix(".tmp.mp4")
    cmd = ["npx", "remotion", "render", "build", comp, str(tmp), "--muted", "--codec=h264", f"--crf={CRF}",
           f"--concurrency={os.environ.get('RENDER_CONCURRENCY', '3')}", "--offthreadvideo-cache-size-in-bytes=536870912", "--pixel-format=yuv420p", "--x264-preset=medium", "--log=error"]
    if BROWSER:
        cmd.append(f"--browser-executable={BROWSER}")
    run(cmd)
    tmp.rename(uit)
    print("gerenderd", comp, flush=True)
    return uit


def probe(p):
    d = json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(p)]))
    v = next(s for s in d["streams"] if s["codec_type"] == "video")
    return d, v


def audio(b, h, totaal, uit):
    hf = frames_hook(b, h) / FPS
    vo_h = ROOT / f"public/vo/{b}h{h}-hook.wav"
    vo_b = ROOT / f"public/vo/{b}-body.wav"
    muziek = ROOT / "public/muziek/muziek.mp3"
    fade = max(0.0, totaal - 2.0)
    flt = (
        f"[0]apad=whole_dur={hf:.3f}[vh];[vh][1]concat=n=2:v=0:a=1,apad=whole_dur={totaal:.3f},"
        f"atrim=0:{totaal:.3f},asplit=2[vo][sc];"
        f"[2]atrim=0:{totaal:.3f},asetpts=PTS-STARTPTS,volume=0.30,afade=t=in:d=0.6,afade=t=out:st={fade:.3f}:d=2[m];"
        f"[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=450[md];"
        f"[vo][md]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[a]"
    )
    run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(vo_h), "-i", str(vo_b), "-i", str(muziek),
         "-filter_complex", flt, "-map", "[a]", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", str(uit)])


def maak(b, h):
    final = OUT / f"westeinde41-body{b[1]}-hook{h}.mp4"
    if final.exists():
        return final
    hook = SEG / f"hook-{b}-h{h}.mp4"
    body = SEG / f"body-{b}.mp4"
    lijst = SEG / f"concat-{b}-h{h}.txt"
    lijst.write_text(f"file '{hook.name}'\nfile '{body.name}'\n")
    video = SEG / f"video-{b}-h{h}.mp4"
    run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lijst), "-c", "copy", str(video)])
    totaal = (frames_hook(b, h) + frames_body(b)) / FPS
    _, v = probe(video)
    n = int(v.get("nb_frames") or 0)
    if n and abs(n - (frames_hook(b, h) + frames_body(b))) > 1:
        print(b, h, "stream-copy gaf", n, "frames; her-encode", flush=True)
        run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lijst), "-c:v", "libx264",
             "-crf", CRF, "-preset", "medium", "-pix_fmt", "yuv420p", str(video)])
    aud = SEG / f"audio-{b}-h{h}.m4a"
    audio(b, h, totaal, aud)
    run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(video), "-i", str(aud), "-map", "0:v", "-map", "1:a",
         "-c", "copy", "-shortest", "-movflags", "+faststart", str(final)])
    d, v = probe(final)
    rot = any(s.get("rotation") for s in v.get("side_data_list", [])) or v.get("tags", {}).get("rotate")
    ok = v["width"] == 1080 and v["height"] == 1920 and v.get("sample_aspect_ratio", "1:1") in ("1:1", "N/A") and not rot
    dur = float(d["format"]["duration"])
    size = int(d["format"]["size"])
    if not ok or size > 250_000_000:
        final.unlink()
        raise RuntimeError(f"{final.name}: afgekeurd {v['width']}x{v['height']} sar {v.get('sample_aspect_ratio')} rot {rot}")
    print(f"klaar {final.name}: {v['width']}x{v['height']} {dur:.1f}s {size/1e6:.1f} MB", flush=True)
    return final


def main():
    keuze = sys.argv[1:]
    paren = [(b, h) for b in ("b1", "b2", "b3") for h in range(1, 6) if not keuze or f"{b}h{h}" in keuze]
    SEG.mkdir(parents=True, exist_ok=True)
    if not (ROOT / "build/index.html").exists() or os.environ.get("REBUNDLE"):
        run(["npx", "remotion", "bundle", "src/index.ts", "--out-dir=build", "--log=error"])
    taken = sorted({("Body-" + b, SEG / f"body-{b}.mp4") for b, _ in paren}) + \
        [(f"Hook-{b}-h{h}", SEG / f"hook-{b}-h{h}.mp4") for b, h in paren]
    # Eén render tegelijk (elk met eigen concurrency): twee parallelle renders liepen tegen het geheugen aan.
    with ThreadPoolExecutor(int(os.environ.get("RENDER_JOBS", "1"))) as pool:
        list(pool.map(lambda t: render(*t), taken))
    with ThreadPoolExecutor(3) as pool:
        list(pool.map(lambda p: maak(*p), paren))


if __name__ == "__main__":
    main()

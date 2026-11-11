"""Batch-render: elke body één keer, elke hook apart (beeld zonder geluid), dan ffmpeg -c copy aan elkaar
en de audio (hook-VO + pauze + body-VO + muziek met ducking) eronder. Resultaat: out/final/*.mp4 (1080x1920).

Gebruik: CHROME=/pad/naar/chrome-headless-shell python3 scripts/render.py [Body1-Hook2 ...]
"""
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
FPS = 30
T = json.loads((ROOT / "src/timing.json").read_text())
CHROME = os.environ.get("CHROME")


def frames(sec):
    return round(sec * FPS)


def render(comp):
    dst = OUT / "parts" / f"{comp}.mp4"
    if dst.exists():
        return dst
    dst.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["npx", "remotion", "render", comp, str(dst.with_suffix(".tmp.mp4")), "--muted", "--concurrency=2", "--crf=24", "--log=error"]
    if CHROME:
        cmd.append(f"--browser-executable={CHROME}")
    subprocess.run(cmd, cwd=ROOT, check=True)
    dst.with_suffix(".tmp.mp4").rename(dst)
    print("render", comp, flush=True)
    return dst


def probe(p):
    return json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(p)],
                                     capture_output=True, text=True, check=True).stdout)


def assemble(b, h):
    name = f"Body{b}-Hook{h}"
    final = OUT / "final" / f"STOCK Haarlem XL - Body {b} Hook {h}.mp4"
    final.parent.mkdir(parents=True, exist_ok=True)
    hook, body = OUT / "parts" / f"Hook{b}-{h}.mp4", OUT / "parts" / f"Body{b}.mp4"
    hd = frames(T["hooks"][f"{b}-{h}"]["duration"]) / FPS
    bd = frames(T["bodies"][str(b)]["duration"]) / FPS
    total = hd + bd
    lst = OUT / "parts" / f"{name}.txt"
    lst.write_text(f"file '{hook.name}'\nfile '{body.name}'\n")
    video = OUT / "parts" / f"{name}-video.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(video)], check=True)
    vs = next(s for s in probe(video)["streams"] if s["codec_type"] == "video")
    if abs(float(vs.get("duration", 0)) - total) > 0.1:
        # stream-copy mislukt: opnieuw coderen
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c:v", "libx264",
                        "-crf", "22", "-pix_fmt", "yuv420p", "-r", str(FPS), str(video)], check=True)
    fc = (
        f"[0:a]aresample=48000,apad=whole_dur={hd:.3f}[h];[1:a]aresample=48000[bv];[h][bv]concat=n=2:v=0:a=1,apad=whole_dur={total:.3f},atrim=0:{total:.3f},asplit[v1][vsc];"
        f"[2:a]aresample=48000,atrim=0:{total:.3f},volume=0.30,afade=t=in:d=0.4,afade=t=out:st={total - 2.2:.3f}:d=2.2[m];"
        f"[m][vsc]sidechaincompress=threshold=0.02:ratio=6:attack=15:release=450:makeup=1[md];"
        f"[v1][md]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]"
    )
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(ROOT / f"public/vo/b{b}h{h}.mp3"), "-i", str(ROOT / f"public/vo/body{b}.mp3"),
                    "-i", str(ROOT / f"public/music/body{b}.mp3"), "-i", str(video), "-filter_complex", fc,
                    "-map", "3:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                    "-t", f"{total:.3f}", "-movflags", "+faststart", str(final)], check=True)
    info = probe(final)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    assert (v["width"], v["height"]) == (1080, 1920), name
    assert v.get("sample_aspect_ratio", "1:1") in ("1:1", "N/A"), name
    assert not any(sd.get("rotation") for sd in v.get("side_data_list", [])), name
    print("final", final.name, v["width"], v["height"], info["format"]["duration"], int(info["format"]["size"]) // 1e6, "MB", flush=True)
    return final


def main():
    pairs = [(b, h) for b in (1, 2, 3) for h in range(1, 6)]
    if sys.argv[1:]:
        pairs = [p for p in pairs if f"Body{p[0]}-Hook{p[1]}" in sys.argv[1:]]
    comps = sorted({f"Body{b}" for b, _ in pairs}) + [f"Hook{b}-{h}" for b, h in pairs]
    with ThreadPoolExecutor(2) as ex:
        list(ex.map(render, comps))
    with ThreadPoolExecutor(3) as ex:
        list(ex.map(lambda p: assemble(*p), pairs))


if __name__ == "__main__":
    main()

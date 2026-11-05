"""Rendert per body één keer (zonder audio) en per hook apart, plakt ze met ffmpeg -c copy en mixt voice-over + muziek (ducking).
Gebruik: python3 scripts/render_all.py <browser-executable>   (twee renders tegelijk, elk concurrency 2)"""
import json, subprocess, sys, concurrent.futures as cf
from pathlib import Path
R = Path(__file__).resolve().parent.parent
CH = sys.argv[1]
OUT = R / "out"; (OUT / "delen").mkdir(parents=True, exist_ok=True)
def render(comp):
    dst = OUT / "delen" / f"{comp}.mp4"
    if dst.exists(): return dst
    subprocess.run(["npx", "remotion", "render", comp, str(dst), "--browser-executable", CH, "--chromium-options=no-sandbox", "--concurrency", "2",
                    "--codec", "h264", "--crf", "24", "--muted", "--pixel-format", "yuv420p", "--x264-preset", "fast"], cwd=R, check=True, capture_output=True)
    return dst
comps = [f"Body{b}" for b in (1, 2, 3)] + [f"Hook{b}-{h}" for b in (1, 2, 3) for h in range(1, 6)]
with cf.ThreadPoolExecutor(2) as ex:
    for c, p in zip(comps, ex.map(render, comps)): print("klaar", c, flush=True)
T = json.load(open(R / "src/timing.json"))
for b in (1, 2, 3):
    for h in range(1, 6):
        key = f"b{b}h{h}"
        lst = OUT / "delen" / f"{key}.txt"
        lst.write_text(f"file 'Hook{b}-{h}.mp4'\nfile 'Body{b}.mp4'\n")
        vid = OUT / "delen" / f"{key}-video.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(vid)], check=True)
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(vid)], capture_output=True, text=True).stdout)
        final = OUT / f"Body{b}-Hook{h}.mp4"
        fc = (f"[1:a]volume=0.2,afade=t=in:d=1,afade=t=out:st={dur-1.5:.2f}:d=1.5[m];"
              f"[0:a]asplit=2[v1][v2];[m][v2]sidechaincompress=threshold=0.02:ratio=10:attack=30:release=500:makeup=1[d];"
              f"[v1][d]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95,apad[a]")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(R / f"public/vo/{key}.mp3"), "-i", str(R / "public/muziek/muziek.mp3"), "-i", str(vid),
                        "-filter_complex", fc, "-map", "2:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{dur:.3f}",
                        "-movflags", "+faststart", str(final)], check=True)
        print("final", final.name, round(dur, 1), final.stat().st_size // 1_000_000, "MB", flush=True)

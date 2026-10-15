"""
Rendert 3 bodies + 15 hooks (staand 1080x1920, CRF 24), plakt per video hook + body met ffmpeg (-c copy) en mixt
voice-over (eleven_v4) en ElevenLabs-muziek (gedempt, ducking onder de stem). Uitvoer: out/body<b>-hook<h>.mp4
Gebruik: python3 scripts/render_alles.py <pad-naar-browser-executable>
"""
import subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BROWSER = sys.argv[1]
SEG = ROOT / "out/segmenten"
SEG.mkdir(parents=True, exist_ok=True)


def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)


def render(comp):
    out = SEG / f"{comp}.mp4"
    if out.exists():
        return
    subprocess.run(["npx", "remotion", "render", comp, str(out), "--browser-executable", BROWSER, "--concurrency", "2", "--offthreadvideo-cache-size-in-bytes", "700000000", "--offthreadvideo-threads", "1", "--log", "error"], cwd=ROOT, check=True)
    print("gerenderd", comp, flush=True)


comps = [f"Body-b{b}" for b in (1, 2, 3)] + [f"Hook-b{b}h{h}" for b in (1, 2, 3) for h in range(1, 6)]
with ThreadPoolExecutor(2) as pool:
    list(pool.map(render, comps))

for b in (1, 2, 3):
    for h in range(1, 6):
        hook, body = SEG / f"Hook-b{b}h{h}.mp4", SEG / f"Body-b{b}.mp4"
        H, B = dur(hook), dur(body)
        T = H + B
        lst = SEG / f"lijst-b{b}h{h}.txt"
        lst.write_text(f"file '{hook}'\nfile '{body}'\n")
        out = ROOT / f"out/body{b}-hook{h}.mp4"
        fc = (f"[0:a]apad=whole_dur={H:.4f},atrim=0:{H:.4f}[h];[1:a]apad=whole_dur={B:.4f},atrim=0:{B:.4f}[b];[h][b]concat=n=2:v=0:a=1[vo];"
              f"[vo]asplit[vo1][vo2];[2:a]atrim=0:{T:.3f},asetpts=N/SR/TB,volume=0.55,afade=t=in:d=0.6,afade=t=out:st={T-1.8:.3f}:d=1.8[m];"
              f"[m][vo2]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=500[md];[vo1][md]amix=inputs=2:weights=1 0.8:normalize=0,alimiter=limit=0.95[a]")
        tmp = SEG / f"video-b{b}h{h}.mp4"
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(tmp)], check=True)
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(ROOT / f"public/vo/b{b}h{h}-hook.wav"), "-i", str(ROOT / f"public/vo/b{b}-body.wav"),
                        "-i", str(ROOT / "public/muziek/muziek.mp3"), "-i", str(tmp), "-filter_complex", fc, "-map", "3:v", "-map", "[a]", "-c:v", "copy",
                        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", "-shortest", str(out)], check=True)
        print("klaar", out.name, round(T, 1), "s", out.stat().st_size // 1024, "KB", flush=True)

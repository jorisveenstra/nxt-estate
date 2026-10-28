"""Rendert 3 bodies + 15 hooks (video zonder geluid, 1080x1920) met Remotion, bouwt per video de audio (voice-over eleven_v4 + muziek
met ducking) en plakt hook + body met ffmpeg (-c copy) tot de eindvideo. Gebruik: python3 scripts/render_all.py <chromium> [uit-map]"""
import json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
CHROME = sys.argv[1]
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "out"
SEG = OUT / "seg"; FIN = OUT / "final"; AUD = OUT / "audio"
for p in (SEG, FIN, AUD): p.mkdir(parents=True, exist_ok=True)
data = json.loads((ROOT / "src/data.json").read_text())


def render(key):
    comp = ("Hook-" if "h" in key else "Body-") + key
    f = SEG / f"{key}.mp4"
    if f.exists(): return key
    subprocess.run(["npx", "remotion", "render", "src/index.ts", comp, str(f), f"--browser-executable={CHROME}", "--muted", "--concurrency=2", "--log=error"], cwd=ROOT, check=True)
    return key


def audio(b, h):
    hk, bk = f"b{b}h{h}", f"b{b}"
    H, B = data[hk]["frames"] / 30, data[bk]["frames"] / 30
    out = AUD / f"{hk}.m4a"
    fc = (f"[0]apad=whole_dur={H}[a];[1]apad=whole_dur={B}[b];[a][b]concat=n=2:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000,apad=whole_dur={H + B},atrim=0:{H + B},asplit=2[vo][key];"
          f"[2]atrim=0:{H + B},asetpts=PTS-STARTPTS,volume=0.30,afade=t=in:d=1.2,afade=t=out:st={H + B - 2.5}:d=2.5[m];"
          f"[m][key]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[md];[vo][md]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[o]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(ROOT / f"scripts/vo/{hk}.mp3"), "-i", str(ROOT / f"scripts/vo/{bk}.mp3"), "-i", str(ROOT / "public/muziek/muziek.mp3"),
                    "-filter_complex", fc, "-map", "[o]", "-t", f"{H + B}", "-ar", "48000", "-ac", "2", "-c:a", "aac", "-b:a", "192k", str(out)], check=True)
    return out


def final(b, h):
    hk, bk = f"b{b}h{h}", f"b{b}"
    lst = AUD / f"{hk}.txt"
    lst.write_text(f"file '{SEG / (hk + '.mp4')}'\nfile '{SEG / (bk + '.mp4')}'\n")
    out = FIN / f"body{b}-hook{h}.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-i", str(audio(b, h)), "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "copy", "-shortest", "-movflags", "+faststart", str(out)], check=True)
    return out


if __name__ == "__main__":
    only = sys.argv[3:] 
    keys = [k for k in data if not only or k in only]
    with ThreadPoolExecutor(2) as ex:
        for k in ex.map(render, keys): print("gerenderd", k, flush=True)
    for b in (1, 2, 3):
        for h in range(1, 6):
            if not only or f"b{b}h{h}" in only: print(final(b, h), flush=True)

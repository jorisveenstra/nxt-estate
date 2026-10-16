"""Rendert 3 body-delen en 15 hook-delen (stil, 1080x1920), plakt per video hook+body (stream copy) en mixt
voice-over (hook, pauze, body) + muziek (ducking) met ffmpeg. Gebruik: python3 scripts/render_all.py [browser-exe]"""
import json, os, re, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)
BROWSER = sys.argv[1] if len(sys.argv) > 1 else "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"
T = json.loads((ROOT / "src/timing.json").read_text())
PARTS, OUT = ROOT / "out/parts", ROOT / "out"
PARTS.mkdir(parents=True, exist_ok=True)


def render(comp):
    f = PARTS / f"{comp}.mp4"
    if f.exists(): return
    subprocess.run(["npx", "remotion", "render", "src/index.ts", comp, str(f), f"--browser-executable={BROWSER}", "--muted", "--crf=24",
                    "--pixel-format=yuv420p", "--codec=h264", "--concurrency=3", "--log=error"], check=True)


def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)


def main():
    comps = [f"Body{b}" for b in (1, 2, 3)] + [f"Hook{b}-{h}" for b in (1, 2, 3) for h in range(1, 6)]
    with ThreadPoolExecutor(1) as ex:
        list(ex.map(render, comps))
    for b in (1, 2, 3):
        for h in range(1, 6):
            hp, bp = PARTS / f"Hook{b}-{h}.mp4", PARTS / f"Body{b}.mp4"
            hd = dur(hp)
            lst = PARTS / f"l{b}{h}.txt"
            lst.write_text(f"file '{hp}'\nfile '{bp}'\n")
            total = hd + dur(bp)
            delay = int(round(hd * 1000))
            # Revisie 2: loudnorm liet het geluid in de laatste seconden wegvallen (CTA). Nu: VO eerst naar een WAV van
            # exact de videolengte, loudheid meten (ebur128) en met een vaste gain naar -16 LUFS; muziek loopt door tot het einde.
            vo_wav = PARTS / f"vo{b}{h}.wav"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"public/vo/b{b}-h{h}.mp3", "-i", f"public/vo/b{b}-body.mp3",
                            "-filter_complex", f"[0:a]apad[bv];[1:a]adelay={delay}:all=1[bw];[bv][bw]amix=inputs=2:normalize=0:duration=longest,apad=whole_dur={total:.3f},atrim=0:{total:.3f}[a]",
                            "-map", "[a]", "-ar", "44100", "-ac", "2", str(vo_wav)], check=True)
            m = subprocess.run(["ffmpeg", "-nostats", "-i", str(vo_wav), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
            lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", m)[-1])
            gain = -16.0 - lufs
            fc = (f"[1:a]volume={gain:.2f}dB,asplit=2[vo][sc];"
                  f"[2:a]atrim=0:{total:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=1.5,afade=t=out:st={total - 1.2:.3f}:d=1.2,volume=0.55[mu];"
                  f"[mu][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=500[du];"
                  f"[vo][du]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.95,apad=whole_dur={total:.3f},atrim=0:{total:.3f}[a]")
            out = OUT / f"Body {b} Hook {h}.mp4"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
                            "-i", str(vo_wav), "-i", "public/muziek/muziek.mp3",
                            "-filter_complex", fc, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out)], check=True)
            print(out.name, f"{total:.1f}s", out.stat().st_size // 1000, "kB", flush=True)


if __name__ == "__main__":
    main()

"""
Rendert alle 15 video's efficiënt: elke body één keer (Body-b<B>) en per variant alleen de hook (Hook-b<B>h<H>),
beide zonder audio. Daarna per video: hook + body samenvoegen met ffmpeg -c copy (zelfde codec/instellingen),
en de audio mixen: stem (hook + body) + ElevenLabs-muziek zacht eronder met ducking en korte fades.

Gebruik: python3 scripts/render.py [--browser /pad/naar/chrome-headless-shell] [B H ...]
Uit: out/final/Body <B> Hook <H>.mp4 (1080x1920, faststart)
"""
import json, subprocess, sys, concurrent.futures as cf
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
FPS, TAIL = 30, 2.5
args = sys.argv[1:]
browser = []
if "--browser" in args:
    i = args.index("--browser"); browser = ["--browser-executable", args[i + 1]]; del args[i:i + 2]
T = json.loads((ROOT / "src/timing.json").read_text())
PAIRS = [(b, h) for b in (1, 2, 3) for h in (1, 2, 3, 4, 5)]


def run(cmd):
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(" ".join(cmd[:4]) + "\n" + r.stdout[-1500:] + r.stderr[-1500:])
    return r


def render(comp, out):
    if out.exists():
        return out
    tmp = out.with_suffix(".part.mp4")
    cmd = ["npx", "remotion", "render", comp, str(tmp), "--muted", "--codec=h264", "--crf=24", "--concurrency=2",
           "--pixel-format=yuv420p", "--x264-preset=medium", *browser]
    try:
        run(cmd)
    except RuntimeError:  # een enkele browser-/geheugenhik: één keer opnieuw (lokaal, geen betaalde aanvraag)
        print("opnieuw", comp, flush=True)
        run(cmd)
    tmp.rename(out)
    print("gerenderd", comp, flush=True)
    return out


def frames_hook(b, h): return round(T[f"b{b}"]["hooks"][str(h)]["dur"] * FPS)
def frames_body(b): return round((T[f"b{b}"]["body"]["end"] + TAIL) * FPS)


def music_end(b):
    """Tijdstip waarop de eigen outro van de muziek stil wordt (laatste stilte tot het einde)."""
    r = subprocess.run(["ffmpeg", "-nostdin", "-i", f"public/muziek/b{b}.mp3", "-af", "silencedetect=n=-30dB:d=0.4", "-f", "null", "-"],
                       cwd=ROOT, capture_output=True, text=True).stderr
    starts = [float(l.split("silence_start:")[1]) for l in r.splitlines() if "silence_start:" in l]
    dur = float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"public/muziek/b{b}.mp3"]).stdout)
    return starts[-1] if starts and starts[-1] > dur - 8 else dur


def assemble(b, h):
    final = OUT / "final" / f"Body {b} Hook {h}.mp4"
    final.parent.mkdir(parents=True, exist_ok=True)
    hv, bv = OUT / "seg" / f"hook-b{b}h{h}.mp4", OUT / "seg" / f"body-b{b}.mp4"
    lst = OUT / "seg" / f"list-b{b}h{h}.txt"
    lst.write_text(f"file '{hv}'\nfile '{bv}'\n")
    vid = OUT / "seg" / f"join-b{b}h{h}.mp4"
    run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(vid)])
    hs, bs = frames_hook(b, h) / FPS, frames_body(b) / FPS
    total = hs + bs
    # controleer stream-copy: verwacht aantal frames, anders opnieuw encoderen
    n = int(run(["ffprobe", "-v", "error", "-count_packets", "-select_streams", "v", "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", str(vid)]).stdout.strip().strip(","))
    if n != frames_hook(b, h) + frames_body(b):
        run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c:v", "libx264", "-crf", "24", "-pix_fmt", "yuv420p", str(vid)])
    # muziek iets vertragen (max 8%, toonhoogte blijft gelijk) zodat de natuurlijke outro op het einde valt
    tempo = max(0.92, min(1.0, music_end(b) / (total - 0.6)))
    # stem genormaliseerd op -15 LUFS; muziek ~15 dB eronder (-30 LUFS), extra ducking tijdens spraak
    filt = (
        f"[0]apad,atrim=end={hs:.4f}[h];[1]apad,atrim=end={bs:.4f}[bd];[h][bd]concat=n=2:v=0:a=1,"
        f"loudnorm=I=-15:TP=-1.5:LRA=7,aresample=48000,asplit=2[vo][sc];"
        f"[2]atempo={tempo:.4f},atrim=end={total:.4f},asetpts=N/SR/TB,loudnorm=I=-30:TP=-9:LRA=11,aresample=48000,"
        f"afade=t=in:d=0.4,afade=t=out:st={total - 1.0:.3f}:d=1.0[m];"
        f"[m][sc]sidechaincompress=threshold=0.02:ratio=3:attack=50:release=600[md];"
        f"[vo][md]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.89:level=false[a]"
    )
    run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", f"public/vo/b{b}h{h}-hook.wav", "-i", f"public/vo/b{b}-body.wav",
         "-i", f"public/muziek/b{b}.mp3", "-i", str(vid), "-filter_complex", filt, "-map", "3:v", "-map", "[a]",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{total:.4f}", "-movflags", "+faststart", str(final)])
    return final


def main():
    (OUT / "seg").mkdir(parents=True, exist_ok=True)
    pairs = PAIRS if not args else [(int(args[i]), int(args[i + 1])) for i in range(0, len(args), 2)]
    jobs = sorted({("Body-b%d" % b, OUT / "seg" / f"body-b{b}.mp4") for b, _ in pairs}) + [
        (f"Hook-b{b}h{h}", OUT / "seg" / f"hook-b{b}h{h}.mp4") for b, h in pairs]
    with cf.ThreadPoolExecutor(2) as ex:  # 4 cores: twee renders tegelijk, elk concurrency 2
        list(ex.map(lambda j: render(*j), jobs))
    for b, h in pairs:
        print("klaar", assemble(b, h), flush=True)


if __name__ == "__main__":
    main()

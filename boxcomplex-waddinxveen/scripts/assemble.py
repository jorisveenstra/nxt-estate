"""Maakt de 15 eindvideo's: hook-segment + body-segment (ffmpeg concat -c copy), plus audiomix:
eleven_v4-VO (hook op 0 s, body direct na het hooksegment) en het ElevenLabs-muziekbed zacht eronder
met sidechain-ducking, korte fades en loudnorm. Uitvoer: out/final/Body <B> Hook <H>.mp4 (faststart)."""
import json, subprocess, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
plan = json.loads((ROOT / "src/plan.json").read_text()); FPS = plan["fps"]
OUT = ROOT / "out/final"; OUT.mkdir(parents=True, exist_ok=True)
tmp = ROOT / "out/tmp"; tmp.mkdir(parents=True, exist_ok=True)

def run(cmd): subprocess.run(cmd, check=True, capture_output=True)

def build(b, h):
    hs, bs = plan["segments"][f"b{b}_h{h}"], plan["segments"][f"b{b}"]
    hook_s = hs["frames"] / FPS; total = (hs["frames"] + bs["frames"]) / FPS
    lst = tmp / f"b{b}h{h}.txt"
    lst.write_text(f"file '{ROOT}/out/seg/b{b}_h{h}.mp4'\nfile '{ROOT}/out/seg/b{b}.mp4'\n")
    vid = tmp / f"b{b}h{h}_v.mp4"
    run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(vid)])
    final = OUT / f"Body {b} Hook {h}.mp4"
    d = int(round(hook_s * 1000))
    fc = (f"[1:a]aresample=48000,apad[hv];[2:a]aresample=48000,adelay={d}|{d}[bv];"
          f"[hv][bv]amix=inputs=2:normalize=0,atrim=0:{total:.3f},asplit[vo][sc];"
          f"[3:a]aresample=48000,atrim=0:{total:.3f},volume=0.30,afade=t=in:d=0.4,afade=t=out:st={total-2.2:.3f}:d=2.2[mu];"
          f"[mu][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[duck];"
          f"[vo][duck]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]")
    run(["ffmpeg", "-y", "-v", "error", "-i", str(vid), "-i", str(ROOT / f"public/vo/b{b}_h{h}.mp3"),
         "-i", str(ROOT / f"public/vo/b{b}_body.mp3"), "-i", str(ROOT / "public/muziek/muziekbed.mp3"),
         "-filter_complex", fc, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
         "-t", f"{total:.3f}", "-movflags", "+faststart", str(final)])
    return final

if __name__ == "__main__":
    pairs = [(b, h) for b in (1, 2, 3) for h in range(1, 6)]
    if len(sys.argv) > 1: pairs = [tuple(map(int, a.split(","))) for a in sys.argv[1:]]
    for b, h in pairs: print(build(b, h), flush=True)

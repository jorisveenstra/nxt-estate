"""
Plakt per video hook + body aan elkaar (stream copy, identieke codec-parameters), mengt voice-over (eleven_v4, Tijs)
en muziek (ElevenLabs music_v1, geduckt onder de stem) en schrijft out/final/<titel>.mp4 (faststart).
Gebruik: python3 scripts/assembleer.py
"""
import json, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
FPS = 30
timing = json.loads((ROOT / "src/timing.json").read_text())
(ROOT / "out/final").mkdir(parents=True, exist_ok=True)
for b in (1, 2):
    for h in (1, 2, 3, 4, 5):
        hook_f, body_f = timing[f"b{b}h{h}"]["frames"], timing[f"b{b}"]["frames"]
        hd, bd = hook_f / FPS, body_f / FPS
        total = hd + bd
        lst = ROOT / f"out/_concat_b{b}h{h}.txt"
        lst.write_text(f"file '{(ROOT / f'out/Body{b}-Hook{h}.mp4').resolve()}'\nfile '{(ROOT / f'out/Body{b}.mp4').resolve()}'\n")
        fc = (
            f"[1:a]apad=whole_dur={hd:.4f}[h];[h][2:a]concat=n=2:v=0:a=1,apad=whole_dur={total:.4f},atrim=0:{total:.4f}[vo];"
            f"[3:a]atrim=0:{total:.4f},asetpts=PTS-STARTPTS,afade=t=in:d=1.2,afade=t=out:st={total - 3:.3f}:d=3,volume=0.55[m];"
            f"[vo]asplit[vo1][vo2];[m][vo1]sidechaincompress=threshold=0.03:ratio=10:attack=15:release=450:makeup=1[md];"
            f"[vo2][md]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[a]"
        )
        out = ROOT / f"out/final/Body {b} Hook {h}.mp4"
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
                        "-i", str(ROOT / f"public/vo/b{b}h{h}-hook.wav"), "-i", str(ROOT / f"public/vo/b{b}-body.wav"), "-i", str(ROOT / "public/muziek/muziek.mp3"),
                        "-filter_complex", fc, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-t", f"{total:.4f}", str(out)], check=True)
        lst.unlink()
        print("klaar", out.name, f"{total:.1f}s")

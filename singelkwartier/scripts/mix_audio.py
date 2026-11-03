"""Mixt per video voice-over + muziek (ducking onder de spraak) tot public/audio/b<b>h<h>.m4a."""
import json, math, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
T = json.loads((ROOT / "src/timing.json").read_text())
FPS, PAUZE, TAIL = 30, 0.45, 1.0

for b in (1, 2):
    bd = T["bodies"][f"b{b}"]
    bf = math.ceil((bd["bodyDur"] + TAIL) * FPS)
    for h in range(1, 6):
        k = f"b{b}h{h}"
        hf = round((T["hooks"][k]["hookEnd"] + PAUZE) * FPS)
        total = (hf + bf) / FPS
        fil = (
            f"[0:a]apad,atrim=0:{total:.3f},asetpts=N/SR/TB[vo];"
            f"[1:a][1:a]acrossfade=d=3,atrim=0:{total:.3f},asetpts=N/SR/TB,volume=0.42,"
            f"afade=t=in:d=1.5,afade=t=out:st={total-2.5:.3f}:d=2.5[m];"
            f"[vo]asplit=2[vo1][vo2];[m][vo2]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=500:makeup=1[md];"
            f"[vo1][md]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.95[out]"
        )
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(ROOT / f"public/vo/{k}.wav"), "-i", str(ROOT / "public/music/music.mp3"),
                        "-filter_complex", fil, "-map", "[out]", "-t", f"{total:.3f}", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", str(ROOT / f"public/audio/{k}.m4a")], check=True)
        print(k, round(total, 2))

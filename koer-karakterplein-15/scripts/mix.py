"""Plakt hook- en bodysegment aan elkaar (stream copy) en mixt voice-over (eleven_v4) met muziek (music_v1) eronder, met ducking.
Gebruik: python3 scripts/mix.py   ->  out/final/Body <b> Hook <h>.mp4"""
import subprocess, json, math
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
SEG, VO, MUS = ROOT / "out/seg", ROOT / "public/vo", ROOT / "public/muziek/music.mp3"
FIN = ROOT / "out/final"; FIN.mkdir(parents=True, exist_ok=True)
def dur(p): return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], text=True))
for b in (1, 2, 3):
    for h in range(1, 6):
        hs, bs = SEG / f"Hook{b}-{h}.mp4", SEG / f"Body{b}.mp4"
        lst = FIN / f"_l{b}{h}.txt"; lst.write_text(f"file '{hs}'\nfile '{bs}'\n")
        vid = FIN / f"_v{b}{h}.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(vid)], check=True)
        hd = dur(hs); total = dur(vid)
        delay = int(round(hd * 1000))
        voa = FIN / f"_vo{b}{h}.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(VO / f"b{b}-h{h}.mp3"), "-i", str(VO / f"b{b}-body.mp3"), "-filter_complex",
                        f"[1:a]adelay={delay}|{delay}[bd];[0:a][bd]amix=inputs=2:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=9,apad=whole_dur={total:.2f},atrim=0:{total:.2f}[vo]",
                        "-map", "[vo]", "-ar", "44100", str(voa)], check=True)
        # Revisie: past de tijdlijn net niet in de bestaande muziekstem (60 s), dan wordt de stem
        # onhoorbaar iets vertraagd (max. ~2%) i.p.v. opnieuw (betaald) muziek te genereren.
        md = dur(MUS); tempo = f"atempo={max(0.97, md / (total + 0.1)):.4f}," if total + 0.1 > md else ""
        fc = (f"[0:a]asplit=2[vo1][sc];[1:a]{tempo}atrim=0:{total:.2f},asetpts=PTS-STARTPTS,volume=0.35,afade=t=in:d=0.6,afade=t=out:st={total-1.8:.2f}:d=1.8,apad=whole_dur={total:.2f}[m];"
              f"[m][sc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[md];[vo1][md]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.95,atrim=0:{total:.2f}[a]")
        out = FIN / f"Body {b} Hook {h}.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(voa), "-i", str(MUS), "-i", str(vid),
                        "-filter_complex", fc, "-map", "2:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out)], check=True)
        voa.unlink()
        vid.unlink(); lst.unlink()
        print(out.name, round(dur(out), 1), "s", round(out.stat().st_size / 1e6, 1), "MB", flush=True)

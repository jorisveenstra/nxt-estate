"""Plakt hook + body (stream copy), bouwt audio (eleven_v4 VO + muziek met ducking) en muxt -> out/final/<b>h<h>.mp4"""
import json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
T = json.loads((ROOT/"src/timing.json").read_text()); sc = json.loads((ROOT/"scripts/scripts.json").read_text())
CACHE = ROOT/"scripts/tts-cache"; prov = json.loads((ROOT/"scripts/vo-provenance.json").read_text())
import hashlib
def mp3(b, key):
    for p in CACHE.glob("*.json"):
        m = json.loads(p.read_text())["_meta"]
        if m["request_id"] == prov[f"{b}-{key}"]["request_id"]: return CACHE/(p.stem+".mp3")
def run(*a): subprocess.run(a, check=True)
(ROOT/"out/final").mkdir(parents=True, exist_ok=True); (ROOT/"out/tmp").mkdir(exist_ok=True)
for k, h in T["hooks"].items():
    b = k[:2]; n = k[3]; fin = ROOT/f"out/final/{k}.mp4"; tmp = ROOT/"out/tmp"
    lst = tmp/f"{k}.txt"; lst.write_text(f"file '{ROOT}/out/parts/Hook-{k}.mp4'\nfile '{ROOT}/out/parts/Body{b[1]}.mp4'\n")
    vid = tmp/f"{k}-v.mp4"; run("ffmpeg","-v","error","-y","-f","concat","-safe","0","-i",str(lst),"-c","copy",str(vid))
    dur = (h["frames"] + T["bodies"][b]["frames"]) / 30; hd = h["frames"]/30
    hk, bd = mp3(b, n), mp3(b, "body")
    fc = (f"[0]apad=whole_dur={hd}[h];[h][1]concat=n=2:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000,asplit=2[vo][sc];"
          f"[2]volume=0.20,afade=t=in:d=0.8,afade=t=out:st={dur-2.0}:d=2.0,atrim=0:{dur},aresample=48000[m];"
          f"[m][sc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[md];[vo][md]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95,atrim=0:{dur}[a]")
    run("ffmpeg","-v","error","-y","-i",str(hk),"-i",str(bd),"-i",str(ROOT/"public/muziek/bed.mp3"),"-i",str(vid),"-filter_complex",fc,
        "-map","3:v","-map","[a]","-c:v","copy","-c:a","aac","-b:a","192k","-movflags","+faststart","-t",f"{dur}",str(fin))
    print("ok", k, round(dur,1))

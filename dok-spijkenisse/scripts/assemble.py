"""Zet hook + body aan elkaar (video: stream copy), mixt voice-over + muziek (ducking) en maakt de bron-ZIP.
Gebruik: python3 scripts/assemble.py   -> out/final/Body-X-Hook-Y.mp4 en out/zips/Body-X-Hook-Y.zip"""
import json, re, subprocess, zipfile, math
from pathlib import Path
R = Path(__file__).resolve().parent.parent
FPS = 30
(R/"out/final").mkdir(parents=True, exist_ok=True); (R/"out/zips").mkdir(exist_ok=True)

def dur(p):
    return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(p)]))

def used_clips(b, h):
    cfg = (R/"src/config.ts").read_text()
    body = re.search(rf"\n  {b}: \{{\n(.*?)\n  \}},", cfg, re.S).group(1)
    hook = re.search(rf"export const HOOK_CLIPS.*?\n  {b}: \{{(.*?)\}},\n", cfg, re.S).group(1)
    hk = re.search(rf"{h}: \[([^\]]*)\]", hook).group(1)
    return set(re.findall(r'"([a-z_0-9]+)"', body.replace("at:", "")) ) & {p.stem for p in (R/"public/clips").glob("*.mp4")} | set(re.findall(r'"([a-z_0-9]+)"', hk))

for b in (1,2,3):
    for h in (1,2,3,4,5):
        name = f"Body-{b}-Hook-{h}"
        out = R/f"out/final/{name}.mp4"
        hv, bv = R/f"out/seg/Hook{b}-{h}.mp4", R/f"out/seg/Body{b}.mp4"
        hd, bd = dur(hv), dur(bv)
        done = out.exists()
        total = hd + bd
        if not done: pass
        lst = R/"out/tmp"/f"{name}.txt"; lst.parent.mkdir(exist_ok=True)
        lst.write_text(f"file '{hv}'\nfile '{bv}'\n")
        vid = R/"out/tmp"/f"{name}-v.mp4"
        if not done: subprocess.run(["ffmpeg","-v","error","-y","-f","concat","-safe","0","-i",str(lst),"-c","copy",str(vid)],check=True)
        ms = int(round(hd*1000))
        fc = (f"[0:a]adelay=0|0[h];[1:a]adelay={ms}|{ms}[b];[h][b]amix=inputs=2:normalize=0,asplit=2[vo][key];"
              f"[2:a]atrim=0:{total:.3f},volume=0.5,afade=t=in:d=0.8,afade=t=out:st={total-1.8:.3f}:d=1.8[m];"
              f"[m][key]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[md];"
              f"[vo][md]amix=inputs=2:normalize=0,alimiter=limit=0.95,apad,atrim=0:{total:.3f}[a]")
        if not done: subprocess.run(["ffmpeg","-v","error","-y","-i",str(R/f"public/vo/b{b}-hook{h}.mp3"),"-i",str(R/f"public/vo/b{b}-body.mp3"),
                        "-i",str(R/"public/muziek/muziek.mp3"),"-i",str(vid),"-filter_complex",fc,"-map","3:v","-map","[a]",
                        "-c:v","copy","-c:a","aac","-b:a","192k","-movflags","+faststart","-shortest",str(out)],check=True)
        # ZIP met bewerkbare bron (geen node_modules/.env/tokens/finale MP4)
        z = R/f"out/zips/{name}.zip"
        clips = used_clips(b, h)
        files = [p for p in R.rglob("*") if p.is_file() and not any(x in p.parts for x in ("node_modules","out","tmp","tts-cache"))
                 and not p.name.startswith(".nxt-") and not (p.parent.name=="clips" and p.stem not in clips)
                 and not (p.parent.name=="vo" and not (p.stem in (f"b{b}-body", f"b{b}-hook{h}")))]
        with zipfile.ZipFile(z,"w",zipfile.ZIP_STORED) as zf:
            for p in files:
                src = (R/"out/zipclips"/p.name) if p.parent.name == "clips" else p
                zf.write(src, "dok-spijkenisse/"+str(p.relative_to(R)))
            zf.write(R.parent/"package.json","package.json"); zf.write(R.parent/"package-lock.json","package-lock.json")
            zf.writestr("dok-spijkenisse/COMPOSITIE.json", json.dumps({"body":b,"hook":h,"compositions":[f"Hook{b}-{h}",f"Body{b}"],"size":"1080x1920","fps":FPS,
              "render":"npx remotion render <id> out.mp4 --muted; daarna scripts/assemble.py (ffmpeg concat + mix)","clips":sorted(clips)}, indent=1))
        print(name, round(total,1), out.stat().st_size//1024//1024, "MB mp4;", z.stat().st_size//1024//1024, "MB zip", flush=True)

"""Rendert per body één keer het body-deel en per hook het hook-deel (staand 1080x1920, alleen beeld),
plakt ze met ffmpeg -c copy aan elkaar en muxt voice-over + muziek (met ducking) erbij."""
import subprocess,sys,json,glob
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent; OUT=ROOT/"out"; OUT.mkdir(exist_ok=True); (OUT/"delen").mkdir(exist_ok=True)
CH=sys.argv[1] if len(sys.argv)>1 else glob.glob("/opt/pw-browsers/chromium-1194/*/chrome")[0]
BASE=["node_modules/.bin/remotion","render","src/index.ts"]
OPT=["--browser-executable="+CH,"--chrome-mode=chrome-for-testing","--concurrency=2","--codec=h264","--crf=24","--muted"]
def render(comp):
    f=OUT/"delen"/f"{comp}.mp4"
    if not f.exists(): subprocess.run(BASE+[comp,str(f)]+OPT,cwd=ROOT,check=True)
    return f
def main():
    for b in (1,2):
        body=render(f"Body{b}-Deel")
        for h in range(1,6):
            hook=render(f"Body{b}-Hook{h}-Deel")
            lst=OUT/"delen"/f"lijst-{b}-{h}.txt"; lst.write_text(f"file '{hook.resolve()}'\nfile '{body.resolve()}'\n")
            video=OUT/"delen"/f"video-{b}-{h}.mp4"
            subprocess.run(["ffmpeg","-v","error","-y","-f","concat","-safe","0","-i",str(lst),"-c","copy",str(video)],check=True)
            vo=ROOT/f"public/vo/b{b}h{h}.wav"; mu=ROOT/"public/muziek/muziek.mp3"
            dur=float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(video)],capture_output=True,text=True).stdout)
            fc=(f"[2:a]atrim=0:{dur},volume=0.5,afade=t=in:d=0.6,afade=t=out:st={dur-1.6}:d=1.6[m0];"
                f"[1:a]asplit[v1][v2];[m0][v2]sidechaincompress=threshold=0.02:ratio=9:attack=15:release=600:makeup=1[duck];"
                f"[v1][duck]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]")
            fin=OUT/f"Body {b} Hook {h}.mp4"
            subprocess.run(["ffmpeg","-v","error","-y","-i",str(video),"-i",str(vo),"-i",str(mu),"-filter_complex",fc,"-map","0:v","-map","[a]",
                "-c:v","copy","-c:a","aac","-b:a","192k","-movflags","+faststart","-t",str(dur),str(fin)],check=True)
            print("klaar",fin.name,fin.stat().st_size//1024,"KB",flush=True)
main()

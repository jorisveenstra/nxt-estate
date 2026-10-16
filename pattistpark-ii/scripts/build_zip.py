import json,re,shutil,subprocess,sys,zipfile
from pathlib import Path
R=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(R/"src"))
plan=(R/"src/plan.ts").read_text()
def clips_for(b,h):
    body=plan.split("export const HOOKS")[0]; hooks=plan.split("export const HOOKS")[1]
    seg=re.search(rf"  {b}: \[(.*?)\n  \],",body,re.S).group(1)
    ids=set(re.findall(r'"(\d\d)"',seg))
    ids|=set(re.findall(r'"(\d\d)"',re.search(rf'"{b}-{h}": \{{ clips: \[(.*?)\]',hooks).group(1)))
    return sorted(ids)
def main():
    out=R/"out"; (out/"zip").mkdir(exist_ok=True)
    for b in (1,2):
        for h in range(1,6):
            st=out/"zip"/f"st-{b}-{h}"; shutil.rmtree(st,ignore_errors=True); st.mkdir(parents=True)
            for f in ["package.json","package-lock.json","remotion.config.ts","tsconfig.json","BRONNEN.md","ledger.json","orig-index.json"]:
                shutil.copy(R/f,st/f)
            shutil.copytree(R/"src",st/"src"); shutil.copytree(R/"scripts",st/"scripts",ignore=shutil.ignore_patterns("tts-cache","__pycache__"))
            pub=st/"public"; pub.mkdir()
            shutil.copytree(R/"public/fonts",pub/"fonts"); shutil.copytree(R/"public/muziek",pub/"muziek")
            (pub/"vo").mkdir(); shutil.copy(R/f"public/vo/b{b}h{h}.wav",pub/"vo")
            (pub/"clips").mkdir(); (pub/"portrait").mkdir()
            for c in clips_for(b,h):
                shutil.copy(R/f"public/clips-klein/{c}.mp4",pub/"clips"/f"{c}.mp4")
                shutil.copy(R/f"portrait/{c}.jpg",pub/"portrait"/f"{c}.jpg")
            z=out/f"bron-{b}-{h}.zip"
            with zipfile.ZipFile(z,"w",zipfile.ZIP_STORED) as zf:
                for p in sorted(st.rglob("*")):
                    if p.is_file(): zf.write(p,p.relative_to(st))
            shutil.rmtree(st); print(z.name,z.stat().st_size//1024//1024,"MB")
main()

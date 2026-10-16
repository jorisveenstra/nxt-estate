"""Voice-overs via ElevenLabs (stem YgjXqgzBJa9op0K278OW, model eleven_v4). Body + CTA één keer per body, hook los.
Authenticatie: proxy-geïnjecteerde xi-api-key (geen sleutel in deze repo). Antwoorden gecached in scripts/tts-cache/."""
import base64,hashlib,json,subprocess,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
CACHE=ROOT/"scripts/tts-cache"; VOICE="YgjXqgzBJa9op0K278OW"; MODEL="eleven_v4"; PAUZE=0.45
def tts(tekst,vorige="",volgende=""):
    body={"text":tekst,"model_id":MODEL,"language_code":"nl"}
    if vorige: body["previous_text"]=vorige
    if volgende: body["next_text"]=volgende
    h=hashlib.sha1(json.dumps(body,sort_keys=True).encode()).hexdigest()[:16]
    pad=CACHE/f"{h}.json"; CACHE.mkdir(exist_ok=True)
    if not pad.exists():
        req=urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(),headers={"Content-Type":"application/json"})
        with urllib.request.urlopen(req,timeout=300) as r:
            hdr={k:v for k,v in r.headers.items() if k.lower() in("request-id","history-item-id","x-request-id")}
            data=json.loads(r.read())
        data["provenance"]={"voice_id":VOICE,"model_id":MODEL,"headers":hdr,"text":tekst}
        pad.write_text(json.dumps(data)); print("gegenereerd:",tekst[:50])
    data=json.loads(pad.read_text()); mp3=CACHE/f"{h}.mp3"
    if not mp3.exists(): mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3,data["alignment"],h
def woorden(al,off):
    uit,cur,s,e=[],"",None,None
    for ch,cs,ce in zip(al["characters"],al["character_start_times_seconds"],al["character_end_times_seconds"]):
        if ch.isspace():
            if cur: uit.append([round(s+off,3),round(e+off,3),cur])
            cur,s="",None; continue
        if s is None: s=cs
        cur+=ch; e=ce
    if cur: uit.append([round(s+off,3),round(e+off,3),cur])
    return uit
def duur(p): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(p)],capture_output=True,text=True).stdout)
def main():
    sc=json.loads((ROOT/"scripts/scripts.json").read_text()); out={}; prov={}
    (ROOT/"public/vo").mkdir(exist_ok=True)
    for b,d in sc.items():
        tekst=" ".join(d["zinnen"])
        bm,ba,bh=tts(tekst,vorige=d["hooks"][0])
        # zinsgrenzen (tijd) via tekenindex
        chars=ba["characters"]; st=ba["character_start_times_seconds"]; en=ba["character_end_times_seconds"]
        pos=0; zin=[]
        for z in d["zinnen"]:
            a=tekst.index(z,pos); e=a+len(z)-1; pos=e+1
            zin.append([st[a],en[e]])
        for h,hook in enumerate(d["hooks"],1):
            hm,ha,hh=tts(hook,volgende=tekst[:300]); hd=duur(hm); sb=hd+PAUZE
            key=f"{b}h{h}"
            out[key]={"woorden":woorden(ha,0)+woorden(ba,sb),"hookEind":round(hd,3),"bodyStart":round(sb,3),
                      "zinnen":[[round(a+sb,3),round(e+sb,3)] for a,e in zin]}
            prov[key]={"hook_cache":hh,"body_cache":bh,"voice_id":VOICE,"model_id":MODEL}
            uit=ROOT/f"public/vo/{key}.wav"
            subprocess.run(["ffmpeg","-v","error","-y","-i",str(hm),"-i",str(bm),"-filter_complex",
                f"[0]apad=pad_dur={PAUZE}[a];[a][1]concat=n=2:v=0:a=1,loudnorm=I=-14:TP=-1:LRA=9","-ar","48000",str(uit)],check=True)
            out[key]["duur"]=round(duur(uit),3); print(key,out[key]["duur"])
    (ROOT/"src").mkdir(exist_ok=True)
    (ROOT/"src/timing.json").write_text(json.dumps(out,ensure_ascii=False))
    (ROOT/"scripts/vo-provenance.json").write_text(json.dumps(prov,indent=1))
main()

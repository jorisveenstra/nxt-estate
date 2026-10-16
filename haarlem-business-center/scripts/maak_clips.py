import json,os,sys,subprocess,time,threading,urllib.request,fcntl
W="/tmp/claude-0/s/work"; LED=W+os.environ.get("LEDGER","/ledger.json")
PROMPT=("Faithful architectural visualization of the exact building and scene shown in the start photo. Subtle realistic slow camera movement (gentle push-in), "
"preserve buildings, proportions, materials and layout exactly, natural daylight. one continuous shot, no cuts, no transitions, no morphing")
lock=threading.Lock()
def led(update=None):
    with lock:
        d=json.load(open(LED)) if os.path.exists(LED) else {}
        if update:
            d.setdefault(update[0],{}).update(update[1]); json.dump(d,open(LED+".tmp","w"),indent=1); os.replace(LED+".tmp",LED)
        return d
def curl(args):
    return subprocess.run(["curl","-sS","-m","300"]+args,capture_output=True,text=True).stdout
def run(k):
    st=led().get(k,{})
    if os.path.exists(f"{W}/clips/{k}.mp4"): return
    if "gen_id" not in st:
        if "post_started" in st: print(k,"UNCERTAIN: post started w/o id; skipping"); return
        a=json.loads(curl(["-X","POST","https://api.elevenlabs.io/v1/assets","-F",f"asset=@{W}/portrait/{k}.png;type=image/png","-F",f"name=hbc-{k}-portrait"]))
        led((k,{"asset_id":a["asset_id"]}))
        led((k,{"post_started":True}))
        body={"model_id":"veo-3.1-generate-001","prompt":PROMPT,"start_frame":{"type":"asset","asset_id":a["asset_id"]},"resolution":"1080p","duration_secs":8,"generate_audio":False,"aspect_ratio":"9:16"}
        r=curl(["-X","POST","https://api.elevenlabs.io/v1/flows/video","-H","Content-Type: application/json","-d",json.dumps(body)])
        try: j=json.loads(r)
        except Exception: print(k,"bad resp",r[:300]); led((k,{"post_resp":r[:300]})); return
        gid=j.get("generation_id") or j.get("id")
        if not gid: print(k,"no id",r[:400]); led((k,{"post_resp":r[:400]})); return
        led((k,{"gen_id":gid})); st=led()[k]
    gid=st["gen_id"]
    for _ in range(120):
        j=json.loads(curl([f"https://api.elevenlabs.io/v1/flows/video/{gid}"]))
        s=j.get("status")
        if s=="completed":
            url=j.get("content_url"); subprocess.run(["curl","-sS","-m","300","-o",f"{W}/clips/{k}.mp4",url],check=True)
            led((k,{"status":"completed"})); print(k,"done"); return
        if s=="failed": led((k,{"status":"failed","resp":str(j)[:400]})); print(k,"FAILED",str(j)[:300]); return
        time.sleep(10)
if __name__=="__main__":
    ks=sys.argv[1:]
    ts=[threading.Thread(target=run,args=(k,)) for k in ks]
    [t.start() for t in ts]; [t.join() for t in ts]

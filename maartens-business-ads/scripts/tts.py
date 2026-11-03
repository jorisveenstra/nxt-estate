import json,subprocess,os,sys,base64,hashlib
sys.path.insert(0,'/tmp/claude-0/work')
from common import bridge
b=bridge()
S=json.load(open('script_struct.json'))
VOICE='YgjXqgzBJa9op0K278OW'; MODEL='eleven_v4'
os.makedirs('vo',exist_ok=True)
jobs={}
for i,s in enumerate(S,1):
    jobs[f'b{i}']=' '.join(s['body']+s['cta'])
    for h,t in s['hooks'].items(): jobs[f'b{i}h{h}']=t
for k,t in jobs.items():
    f=f'vo/{k}.json'
    if os.path.exists(f): continue
    body=dict(text=t,model_id=MODEL,language_code='nl')
    r=subprocess.run(['curl','-sS','-D',f'vo/{k}.hdr','-X','POST',f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128','-H','Content-Type: application/json','-d',json.dumps(body)],capture_output=True,text=True)
    try: js=json.loads(r.stdout)
    except Exception: print(k,'ERR',r.stdout[:300]); sys.exit(1)
    if 'audio_base64' not in js: print(k,'ERR',str(js)[:300]); sys.exit(1)
    open(f'vo/{k}.mp3','wb').write(base64.b64decode(js.pop('audio_base64')))
    js['text']=t; json.dump(js,open(f,'w'),ensure_ascii=False)
    hd={}
    for line in open(f'vo/{k}.hdr'):
        if ':' in line: a,v=line.split(':',1); hd[a.strip().lower()]=v.strip()
    rid=hd.get('request-id') or hd.get('x-request-id')
    print(k,rid,hd.get('character-cost'),flush=True)
    b.record_elevenlabs('voiceover',MODEL,rid,headers=hd,characters=hd.get('character-cost'))
b.flush_usage()

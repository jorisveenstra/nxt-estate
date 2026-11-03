import sys,json,os,subprocess,time,hashlib,urllib.request
n=sys.argv[1]; prompt=sys.argv[2]
H='https://api.elevenlabs.io'
led=f'ledger/{n}.json'
L=json.load(open(led)) if os.path.exists(led) else {}
def save(): json.dump(L,open(led,'w'),indent=1)
def curl(args):
    r=subprocess.run(['curl','-sS','-D','-']+args,capture_output=True,text=True); return r.stdout
if 'asset_id' not in L:
    out=subprocess.run(['curl','-sS','-X','POST',H+'/v1/assets','-F',f'asset=@port/{n}.jpg;type=image/jpeg','-F',f'name=maartens-{n}-portrait'],capture_output=True,text=True).stdout
    print(out[:300]); L['asset_id']=json.loads(out).get('asset_id') or json.loads(out).get('id'); save()
if 'gen_id' not in L:
    body=dict(model_id='veo-3.1-generate-001',prompt=prompt,start_frame=dict(type='asset',asset_id=L['asset_id']),resolution='1080p',duration_secs=8,generate_audio=False,aspect_ratio='9:16')
    r=subprocess.run(['curl','-sS','-i','-X','POST',H+'/v1/flows/video','-H','Content-Type: application/json','-d',json.dumps(body)],capture_output=True,text=True).stdout
    L['post_raw']=r[:1500]; save(); print(r[:1200])
    js=json.loads(r.strip().splitlines()[-1])
    L['gen_id']=js.get('generation_id') or js.get('id'); save()
while True:
    out=subprocess.run(['curl','-sS',H+'/v1/flows/video/'+L['gen_id']],capture_output=True,text=True).stdout
    js=json.loads(out); st=js.get('status'); print(n,st,flush=True)
    if st in('completed','failed'): L['final']=js; save(); break
    time.sleep(15)
if st=='completed':
    subprocess.run(['curl','-sS','-f','-o',f'clips/{n}.mp4',js['content_url']],check=True)

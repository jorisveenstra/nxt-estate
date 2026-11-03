import json,zipfile,os,sys,hashlib
W='/tmp/claude-0/work'; R='/home/user/nxt-estate'; P=R+'/maartens-business-ads'
meta={m['n']:m for m in json.load(open(W+'/srcmeta.json'))}
def hdr(k):
    d={}
    for l in open(f'{W}/vo/{k}.hdr'):
        if ':' in l:
            a,v=l.split(':',1); d[a.strip().lower()]=v.strip()
    return d.get('request-id')
def build(id):
    pr=json.load(open(f'{P}/props/{id}.json')); bi=pr['body']; h=pr['hookIndex']
    clips=sorted({s['clip'] for s in pr['shots']})
    out=f'{W}/zips/{id}.zip'; os.makedirs(W+'/zips',exist_ok=True)
    z=zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED)
    def add(path,arc,store=False): z.write(path,arc,compress_type=zipfile.ZIP_STORED if store else zipfile.ZIP_DEFLATED)
    for f in ['package.json','remotion.config.ts','tsconfig.json']: add(f'{P}/{f}',f)
    add(R+'/package-lock.json','package-lock.json'); add(R+'/package.json','root-package.json')
    for f in ['index.ts','Root.tsx','Ad.tsx']: add(f'{P}/src/{f}','src/'+f)
    add(f'{P}/props/{id}.json',f'props/{id}.json')
    for f in os.listdir(P+'/public/fonts'): add(f'{P}/public/fonts/{f}','public/fonts/'+f,True)
    for f in os.listdir(P+'/public/logo'): add(f'{P}/public/logo/{f}','public/logo/'+f,True)
    add(f'{W}/audio/{id}.mp3',f'public/audio/{id}.mp3',True)
    prov={'voice':{'model_id':'eleven_v4','voice_id':'YgjXqgzBJa9op0K278OW','requests':{}},'music':{'model_id':'music_v1','song_id':'jiIUMcDcMVfWXywLVxuH','settings':json.load(open(W+'/music/settings.json'))},'video':{}, 'sources':{}, 'soundEffects':'disabled'}
    for k in [f'b{bi}',f'b{bi}h{h}']:
        add(f'{W}/vo/{k}.mp3',f'stems/vo/{k}.mp3',True); add(f'{W}/vo/{k}.json',f'stems/vo/{k}.json')
        prov['voice']['requests'][k]=hdr(k)
    add(W+'/music/stem.mp3','stems/music/stem.mp3',True)
    for c in clips:
        add(f'{W}/clips/{c}.mp4',f'public/clips/{c}.mp4',True); add(f'{W}/port/{c}.jpg',f'sources/portrait/{c}.jpg',True); add(f'{W}/src/{c}.jpg',f'sources/original/{c}.jpg',True)
        L=json.load(open(f'{W}/ledger/{c}.json'))
        prov['video'][c]={'model_id':'veo-3.1-generate-001','generation_id':L['gen_id'],'resolution':'1080p','aspect_ratio':'9:16','duration_secs':8,'clip_sha256':hashlib.sha256(open(f'{W}/clips/{c}.mp4','rb').read()).hexdigest()}
        prov['sources'][c]={'original_sha256':meta[c]['sha'],'frameio_library_id':meta[c]['id'],'filename':meta[c]['filename']}
    prov['branding']='Maartens Business: donkerrood #800000, antraciet, wit; Raleway + DM Sans (lokaal); logo public/logo'
    prov['render']='cd project; npm i (zie package-lock.json); npx remotion render Ad out.mp4 --props=props/%s.json'%id
    z.writestr('provenance.json',json.dumps(prov,indent=1)); z.close()
    return out,os.path.getsize(out)
if __name__=='__main__':
    for i in sys.argv[1:]: print(i,build(i))

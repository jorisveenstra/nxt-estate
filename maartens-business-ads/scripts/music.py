import json,subprocess,sys
sys.path.insert(0,'/tmp/claude-0/work')
from common import bridge
b=bridge()
prompt="Uplifting, positive, modern corporate instrumental background music for a real estate commercial property advertisement. Light driving rhythm, warm piano and soft synths, optimistic and confident, no vocals, no lyrics."
body=dict(prompt=prompt,model_id='music_v1',force_instrumental=True,music_length_ms=70000)
r=subprocess.run(['curl','-sS','-D','music/h.txt','-o','music/stem.mp3','-X','POST','https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128','-H','Content-Type: application/json','-d',json.dumps(body)],capture_output=True,text=True)
json.dump(body,open('music/settings.json','w'))
hd={}
for l in open('music/h.txt'):
    if ':' in l: a,v=l.split(':',1); hd[a.strip().lower()]=v.strip()
print({k:v for k,v in hd.items() if 'id' in k or 'cost' in k or k=='content-type'})
rid=hd.get('request-id') or hd.get('x-request-id')
b.record_elevenlabs('music','music_v1',rid,headers=hd,seconds=70)
b.flush_usage()

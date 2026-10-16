import json,urllib.request,hashlib
from pathlib import Path
R=Path(__file__).resolve().parent.parent
body={"prompt":"Uplifting, warm and positive instrumental background music for a real estate advertisement about modern waterfront apartments in a Dutch coastal town. Gentle acoustic guitar and soft piano, light airy strings, subtle steady percussion, hopeful and welcoming mood, mid tempo, no vocals, no lyrics.","music_length_ms":52000,"model_id":"music_v1","force_instrumental":True}
req=urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128",data=json.dumps(body).encode(),headers={"Content-Type":"application/json"})
with urllib.request.urlopen(req,timeout=600) as r:
    hdr={k:v for k,v in r.headers.items() if k.lower() in("song-id","request-id","x-request-id","history-item-id")}
    (R/"public/muziek/muziek.mp3").write_bytes(r.read())
(R/"public/muziek/muziek.json").write_text(json.dumps({"request":body,"headers":hdr},indent=1)); print(hdr)

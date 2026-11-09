"""Voice-overs Singelkwartier via ElevenLabs eleven_v4 (stem YgjXqgzBJa9op0K278OW).
Body + CTA één keer, per hook alleen de hook. Auth via proxy-injected xi-api-key (geen sleutel nodig)."""
import base64, hashlib, json, subprocess, sys, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VOICE, MODEL, PAUZE = "YgjXqgzBJa9op0K278OW", "eleven_v4", 0.45
sys.path.insert(0, "/tmp/w")
sys.path.insert(0, str(ROOT / "scripts"))
S = json.loads((ROOT / "scripts/scripts.json").read_text())

def tts(tekst, vorige="", volgende="", bridge=None):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige: body["previous_text"] = vorige
    if volgende: body["next_text"] = volgende
    h = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(),
            headers={"Content-Type": "application/json", "User-Agent": "curl/8"})
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.loads(r.read()); hdr = dict(r.headers)
        data["_meta"] = {"model_id": MODEL, "voice_id": VOICE, "request_id": hdr.get("request-id"), "character_cost": hdr.get("character-cost"), "text": tekst}
        CACHE.mkdir(exist_ok=True); pad.write_text(json.dumps(data))
        print("gegenereerd", tekst[:50], hdr.get("request-id"), hdr.get("character-cost"))
        if bridge and hdr.get("request-id"):
            print(bridge.record_elevenlabs("voiceover", MODEL, hdr["request-id"], headers=hdr, characters=len(tekst)))
    data = json.loads(pad.read_text())
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists(): mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"]

def woorden(al, off):
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur: uit.append([round(s+off,3), round(e+off,3), cur])
            cur, s = "", None; continue
        if s is None: s = cs
        cur += ch; e = ce
    if cur: uit.append([round(s+off,3), round(e+off,3), cur])
    return uit

def duur(p):
    return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(p)],capture_output=True,text=True).stdout)

def main():
    from prog import mk  # lokale helper buiten repo (bevat job-token)
    b = mk()
    btxt = " ".join(S["body"] + [S["cta"]])
    bm, bal = tts(btxt, vorige=S["hooks"][0], bridge=b)
    alle, bd = {}, {}
    for h, hook in enumerate(S["hooks"], 1):
        hm, hal = tts(hook, volgende=btxt[:300], bridge=b)
        hd = duur(hm); sb = hd + PAUZE
        alle[f"h{h}"] = {"hookEnd": round(hd,3), "words": woorden(hal,0) + woorden(bal,sb)}
        uit = ROOT / f"public/vo/h{h}.wav"
        subprocess.run(["ffmpeg","-v","error","-y","-i",str(hm),"-i",str(bm),"-filter_complex",
          f"[0]apad=pad_dur={PAUZE}[a];[a][1]concat=n=2:v=0:a=1,loudnorm=I=-14:TP=-1:LRA=9","-ar","48000",str(uit)],check=True)
        print(h, hd, duur(uit))
    (ROOT/"src/timing.json").write_text(json.dumps(alle, ensure_ascii=False))
main()

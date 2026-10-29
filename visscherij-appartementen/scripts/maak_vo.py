"""Voice-overs via ElevenLabs (stem YgjXqgzBJa9op0K278OW, model eleven_v4).
Body+CTA eenmaal per body, hook per variant. Authenticatie via de netwerk-secret van de omgeving.
Bewaart request-id en character-cost per generatie in scripts/tts-cache/ (geen sleutels)."""
import base64, hashlib, json, subprocess, sys, urllib.request
from pathlib import Path
sys.path.insert(0, "/tmp/claude-0/work")
import helper

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VOICE, MODEL, PAUZE = "YgjXqgzBJa9op0K278OW", "eleven_v4", 0.45
bridge = helper.get()

def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige: body["previous_text"] = vorige
    if volgende: body["next_text"] = volgende
    h = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.loads(r.read()); hd = {k.lower(): v for k, v in r.headers.items()}
        data["_meta"] = {"model_id": MODEL, "voice_id": VOICE, "request_id": hd.get("request-id"),
                         "character_cost": hd.get("character-cost"), "characters": len(tekst)}
        CACHE.mkdir(exist_ok=True); pad.write_text(json.dumps(data))
        print("gegenereerd:", tekst[:50], data["_meta"], flush=True)
        if data["_meta"]["request_id"]:
            print(bridge.record_elevenlabs("voiceover", MODEL, data["_meta"]["request_id"], headers=hd, characters=len(tekst)))
    data = json.loads(pad.read_text())
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists(): mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"]

def woorden(al, off):
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur: uit.append([round(s + off, 3), round(e + off, 3), cur])
            cur, s = "", None; continue
        if s is None: s = cs
        cur += ch; e = ce
    if cur: uit.append([round(s + off, 3), round(e + off, 3), cur])
    return uit

def duur(p):
    return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(p)],capture_output=True,text=True).stdout)

def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    alle = {}
    (ROOT / "public/vo").mkdir(exist_ok=True)
    for b, d in scripts.items():
        zinnen = [z for _, z in d["zinnen"]]
        body_tekst = " ".join(zinnen + [d["cta"]])
        body_mp3, body_al = tts(body_tekst, vorige=d["hooks"][0])
        for h, hook in enumerate(d["hooks"], 1):
            key = f"{b}h{h}"
            hook_mp3, hook_al = tts(hook, volgende=body_tekst[:300])
            hd = duur(hook_mp3); sb = hd + PAUZE
            alle[key] = {"hook": woorden(hook_al, 0), "body": woorden(body_al, sb), "bodyStart": sb}
            uit = ROOT / f"public/vo/{key}.wav"
            subprocess.run(["ffmpeg","-v","error","-y","-i",str(hook_mp3),"-i",str(body_mp3),"-filter_complex",
              f"[0]apad=pad_dur={PAUZE}[a];[a][1]concat=n=2:v=0:a=1,loudnorm=I=-14:TP=-1:LRA=9","-ar","48000",str(uit)],check=True)
            alle[key]["duur"] = duur(uit)
            print(key, round(alle[key]["duur"], 1), flush=True)
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps(alle, ensure_ascii=False))
main()

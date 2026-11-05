"""Voice-overs via ElevenLabs eleven_v4 (stem YgjXqgzBJa9op0K278OW). Auth komt via de proxy (geen sleutel in repo).
Body+CTA eenmaal per body, hooks apart; plakken met pauze. Responses gecachet in scripts/tts-cache (met request-id/model)."""
import base64, hashlib, json, subprocess, sys, urllib.request, ssl
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"; CACHE.mkdir(exist_ok=True)
VOICE, MODEL, PAUZE = "YgjXqgzBJa9op0K278OW", "eleven_v4", 0.45
SPREEK = {"m²": "vierkante meter"}
def sp(t):
    for a, b in SPREEK.items(): t = t.replace(a, b)
    return t
def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige: body["previous_text"] = vorige
    if volgende: body["next_text"] = volgende
    h = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "xi-api-key": "proxy-injected"})
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.loads(r.read()); hd = {k.lower(): v for k, v in r.headers.items()}
        data["_meta"] = {"model_id": MODEL, "voice_id": VOICE, "request_id": hd.get("request-id"), "headers": {k: v for k, v in hd.items() if k in ("request-id", "character-cost")}, "text": tekst, "new": True}
        pad.write_text(json.dumps(data))
    data = json.loads(pad.read_text())
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists(): mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"], data["_meta"]
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
def duur(p): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(p)],capture_output=True,text=True).stdout)
def main():
    sc = json.loads((ROOT / "scripts/scripts.json").read_text())
    jobs = {}
    for b, d in sc.items():
        bt = sp(" ".join(d["body"] + d["cta"]))
        jobs[(b, "body")] = (bt, sp(d["hooks"][0]), "")
        for h, hook in enumerate(d["hooks"], 1): jobs[(b, h)] = (sp(hook), "", bt[:300])
    with ThreadPoolExecutor(3) as ex:
        res = dict(zip(jobs, ex.map(lambda a: tts(*a), jobs.values())))
    metas = {f"{k[0]}-{k[1]}": res[k][2] for k in res}
    (ROOT / "scripts/vo-provenance.json").write_text(json.dumps(metas, indent=1, ensure_ascii=False))
    alle = {}
    for b, d in sc.items():
        bm, bal, _ = res[(b, "body")]
        for h in range(1, 6):
            hm, hal, _ = res[(b, h)]
            hd = duur(hm); alle[f"{b}h{h}"] = {"hook": woorden(hal, 0), "body": woorden(bal, hd + PAUZE), "hookDur": hd, "bodyStart": hd + PAUZE}
            uit = ROOT / f"public/vo/{b}h{h}.wav"
            subprocess.run(["ffmpeg","-v","error","-y","-i",str(hm),"-i",str(bm),"-filter_complex",f"[0]apad=pad_dur={PAUZE}[a];[a][1]concat=n=2:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=9","-ar","48000",str(uit)],check=True)
            alle[f"{b}h{h}"]["end"] = duur(uit)
            print(b, h, round(alle[f"{b}h{h}"]["end"], 1))
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps(alle, ensure_ascii=False))
main()

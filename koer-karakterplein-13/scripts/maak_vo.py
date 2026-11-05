"""Voice-overs via ElevenLabs (voice YgjXqgzBJa9op0K278OW, model eleven_v4, expliciet). Per body: body+CTA één keer, per hook alleen de hook.
Antwoorden gecachet in scripts/tts-cache (nooit twee keer betalen). Provenance (request-id's, model, voice) -> scripts/vo_provenance.json.
Authenticatie: via de netwerk-proxy (xi-api-key wordt geïnjecteerd); geen sleutel in de repo."""
import base64, hashlib, json, subprocess, sys, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"; CACHE.mkdir(exist_ok=True)
VOICE, MODEL, PAUZE = "YgjXqgzBJa9op0K278OW", "eleven_v4", 0.35
PROV = ROOT / "scripts/vo_provenance.json"
prov = json.loads(PROV.read_text()) if PROV.exists() else {}

def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige: body["previous_text"] = vorige
    if volgende: body["next_text"] = volgende
    h = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers={"xi-api-key": "proxy-injected", "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.loads(r.read()); hd = {k.lower(): v for k, v in r.headers.items()}
        pad.write_text(json.dumps(data))
        prov[h] = {"model_id": MODEL, "voice_id": VOICE, "request_id": hd.get("request-id"), "character_cost": hd.get("character-cost"), "characters": len(tekst), "text_start": tekst[:50]}
        PROV.write_text(json.dumps(prov, indent=1, ensure_ascii=False))
        print("gegenereerd", len(tekst), tekst[:50], hd.get("request-id"), hd.get("character-cost"), flush=True)
    data = json.loads(pad.read_text()); mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists(): mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"], h

def woorden(al, offset):
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur: uit.append([round(s + offset, 3), round(e + offset, 3), cur])
            cur, s = "", None; continue
        if s is None: s = cs
        cur += ch; e = ce
    if cur: uit.append([round(s + offset, 3), round(e + offset, 3), cur])
    return uit

def duur(p): return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)

scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
alle = {}
for b, d in scripts.items():
    zinnen = d["body"] + ([d["cta"]] if d["cta"] else [])
    body_tekst = " ".join(zinnen)
    bm, bal, _ = tts(body_tekst, vorige=d["hooks"][0])
    bw = woorden(bal, 0)
    # zinsgrenzen: aantal woorden per zin
    n = 0; starts = []
    for z in zinnen:
        starts.append(bw[n][0]); n += len(z.split())
    assert n == len(bw), (b, n, len(bw))
    for h, hook in enumerate(d["hooks"], 1):
        hm, hal, _ = tts(hook, volgende=body_tekst[:300])
        hd = duur(hm); sb = hd + PAUZE
        key = f"b{b}h{h}"
        uit = ROOT / f"public/vo/{key}.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(hm), "-i", str(bm), "-filter_complex",
            f"[0]apad=pad_dur={PAUZE}[a];[a][1]concat=n=2:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=9", "-ar", "48000", "-b:a", "192k", str(uit)], check=True)
        alle[key] = {"hook": woorden(hal, 0), "hook_end": round(hd, 3), "body_start": round(sb, 3), "body": woorden(bal, sb),
                     "zin_start": [round(s + sb, 3) for s in starts], "end": round(duur(uit), 3)}
        print(key, "hook", round(hd, 1), "totaal", alle[key]["end"], flush=True)
(ROOT / "src/timing.json").write_text(json.dumps(alle, ensure_ascii=False))

"""Voice-overs via ElevenLabs eleven_v4 (stem YgjXqgzBJa9op0K278OW). Body+CTA één keer per body, hook per variant.
Provenance (model, voice, request-id) -> work/vo-provenance.json. Credits gerapporteerd via bridge.record_elevenlabs."""
import base64, hashlib, json, subprocess, pathlib
from common import *
ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / "work/tts-cache"; VOICE = "YgjXqgzBJa9op0K278OW"; MODEL = "eleven_v4"; PAUZE = 0.35
UITSPRAAK = {"MARK3": "Mark drie", "A16": "A zestien", "A59": "A negenenvijftig", "A27": "A zevenentwintig"}
def spreek(t):
    for a, b in UITSPRAAK.items(): t = t.replace(a, b)
    return t
def tts(tekst, b, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige: body["previous_text"] = vorige
    if volgende: body["next_text"] = volgende
    h = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    p = CACHE / f"{h}.json"; CACHE.mkdir(parents=True, exist_ok=True)
    if not p.exists():
        raw, hd = el("POST", f"/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128", body)
        d = json.loads(raw); d["_headers"] = {k: v for k, v in hd.items() if k.lower() != "set-cookie"}; d["_model"] = MODEL; d["_voice"] = VOICE
        p.write_text(json.dumps(d))
        rid = {k.lower(): v for k, v in hd.items()}.get("request-id")
        print("gegenereerd", len(tekst), rid, tekst[:50], flush=True)
        if rid:
            try: b.record_elevenlabs("voiceover", MODEL, rid, headers=hd, characters=len(tekst))
            except Exception as e: print("usage-fout", type(e).__name__, flush=True)
    d = json.loads(p.read_text()); m = CACHE / f"{h}.mp3"
    if not m.exists(): m.write_bytes(base64.b64decode(d["audio_base64"]))
    return m, d["alignment"], h
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
def dur(p): return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)
if __name__ == "__main__":
    b = bridge()
    sc = json.loads((ROOT / "scripts/scripts.json").read_text()); alle = {}; prov = {}
    (ROOT / "public/vo").mkdir(exist_ok=True)
    for bk, data in sc.items():
        bt = spreek(" ".join(z for _, z in data["zinnen"]))
        bm, ba, bh = tts(bt, b, vorige=spreek(data["hooks"][0]))
        for h, hook in enumerate(data["hooks"], 1):
            key = f"{bk}h{h}"; hm, ha, hh = tts(spreek(hook), b, volgende=bt[:300]); hd = dur(hm)
            alle[key] = woorden(ha, 0) + woorden(ba, hd + PAUZE)
            out = ROOT / f"public/vo/{key}.wav"
            subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(hm), "-i", str(bm), "-filter_complex", f"[0]apad=pad_dur={PAUZE}[a];[a][1]concat=n=2:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=9", "-ar", "48000", str(out)], check=True)
            prov[key] = {"model_id": MODEL, "voice_id": VOICE, "hook_cache": hh, "body_cache": bh}
            print(key, f"{dur(out):.1f}s", flush=True)
    (ROOT / "work/woorden-tts.json").write_text(json.dumps(alle, ensure_ascii=False)); (ROOT / "work/vo-provenance.json").write_text(json.dumps(prov, indent=1))

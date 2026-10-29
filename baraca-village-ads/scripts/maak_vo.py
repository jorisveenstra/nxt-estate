"""Voice-overs via ElevenLabs (stem YgjXqgzBJa9op0K278OW, model eleven_v4) met woordtiming.
Per body: body+CTA één keer; per hook alleen de hook. Resultaten in public/vo/ + vo-meta.json (zonder sleutels).
ElevenLabs-authenticatie loopt via het cloud-netwerkgeheim (xi-api-key wordt door de proxy toegevoegd)."""
import base64, json, sys, pathlib, urllib.request, subprocess, concurrent.futures as cf
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import portal
ROOT = pathlib.Path(__file__).resolve().parent.parent
VOICE, MODEL = "YgjXqgzBJa9op0K278OW", "eleven_v4"
OUT = ROOT / "public/vo"; OUT.mkdir(parents=True, exist_ok=True)
META = ROOT / "vo-meta.json"
meta = json.loads(META.read_text()) if META.exists() else {}

def tts(key, text):
    if key in meta: return
    body = {"text": text, "model_id": MODEL, "language_code": "nl"}
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
        json.dumps(body).encode(), {"xi-api-key": "proxy-injected", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        hdr = {k.lower(): v for k, v in r.headers.items()}; data = json.loads(r.read())
    (OUT / f"{key}.mp3").write_bytes(base64.b64decode(data["audio_base64"]))
    al = data["alignment"]; words, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur: words.append([round(s, 3), round(e, 3), cur])
            cur, s = "", None
        else:
            if not cur: s = cs
            cur += ch; e = ce
    if cur: words.append([round(s, 3), round(e, 3), cur])
    rid = hdr.get("request-id", "")
    meta[key] = {"text": text, "model_id": MODEL, "voice_id": VOICE, "request_id": rid, "character_cost": hdr.get("character-cost"),
                 "words": words}
    if rid:
        portal.record_eleven("voiceover", MODEL, rid, credits=hdr.get("character-cost"), characters=len(text))
    print("ok", key, rid, hdr.get("character-cost"), flush=True)

scripts = json.load(open(ROOT / "scripts/scripts.json"))
jobs = []
for bi, b in enumerate(scripts, 1):
    jobs.append((f"body{bi}", " ".join(b["body"] + [b["cta"]])))
    for hi, t in b["hooks"].items(): jobs.append((f"b{bi}h{hi}", t))
with cf.ThreadPoolExecutor(3) as ex:
    for f in [ex.submit(tts, k, t) for k, t in jobs]: f.result()
META.write_text(json.dumps(meta, ensure_ascii=False, indent=1))
for k in meta:
    d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(OUT / f"{k}.mp3")], capture_output=True, text=True).stdout.strip()
    meta[k]["duration"] = float(d)
META.write_text(json.dumps(meta, ensure_ascii=False, indent=1))
print(portal.flush(), "usage items flushed")

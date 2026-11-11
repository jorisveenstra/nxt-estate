"""Revisie-voice-overs via ElevenLabs eleven_v4 (with-timestamps). Auth via omgevings-netwerksecret (xi-api-key)
of optioneel ELEVENLABS_API_KEY. Sleutels worden nooit opgeslagen. Gebruik: python3 maak_vo_rev.py <projectmap> [usage_hook]"""
import base64, json, os, sys, pathlib, threading, urllib.request, concurrent.futures as cf
P = pathlib.Path(sys.argv[1]); VOICE = "jfwdd64Nlhnj6vcFqRHZ"; MODEL = "eleven_v4"
texts = json.loads((P / "scripts/texts_rev.json").read_text())
ledger_p = P / "provenance/vo_rev_generations.json"; lock = threading.Lock()
ledger = json.loads(ledger_p.read_text()) if ledger_p.exists() else {}
def save():
    ledger_p.write_text(json.dumps(ledger, indent=1, ensure_ascii=False))
def gen(name):
    if name in ledger:
        return name, "skip (already " + ledger[name]["status"] + ")", None
    text = " ".join(texts[name])
    with lock:
        ledger[name] = {"status": "sent", "model_id": MODEL, "voice_id": VOICE, "text": text}; save()
    body = {"text": text, "model_id": MODEL, "language_code": "nl", "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}}
    h = {"Content-Type": "application/json"}
    if os.environ.get("ELEVENLABS_API_KEY"): h["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
                                 json.dumps(body).encode(), h, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            hdr = dict(r.headers.items()); data = json.load(r)
    except urllib.error.HTTPError as e:
        with lock:
            ledger[name]["status"] = f"http_error_{e.code}"; ledger[name]["error"] = e.read(500).decode(errors="replace"); save()
        return name, "HTTP " + str(e.code), None
    except Exception as e:
        with lock:
            ledger[name]["status"] = "uncertain"; ledger[name]["error"] = repr(e)[:300]; save()
        return name, "uncertain", None
    (P / f"public/vo/{name}.mp3").write_bytes(base64.b64decode(data["audio_base64"]))
    (P / f"public/vo/{name}.align.json").write_text(json.dumps(data["alignment"]))
    hl = {k.lower(): v for k, v in hdr.items()}
    with lock:
        ledger[name].update(status="ok", request_id=hl.get("request-id"), history_item_id=hl.get("history-item-id"),
                            character_cost=hl.get("character-cost"), characters=len(text)); save()
    return name, "ok", {k: v for k, v in hl.items() if k in ("request-id", "character-cost", "history-item-id", "x-character-count")}
if __name__ == "__main__":
    names = sys.argv[2:] or list(texts)
    with cf.ThreadPoolExecutor(4) as ex:
        for res in ex.map(gen, names):
            print(json.dumps(res))

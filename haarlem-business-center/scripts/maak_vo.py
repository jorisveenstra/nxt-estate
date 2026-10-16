"""
Voice-overs voor Haarlem Business Center via ElevenLabs (stem YgjXqgzBJa9op0K278OW, model eleven_v4).

Per body wordt body + CTA één keer gesproken en per hook alleen de hook. Timing per woord komt uit de
ElevenLabs-alignment; uitvoer: public/vo/*.mp3 en scripts/woorden-tts.json (+ vo-provenance.json).
Authenticatie: de proxy/omgeving voegt xi-api-key toe; lokaal kan ELEVENLABS_API_KEY gezet worden.
"""
import base64, hashlib, json, os, subprocess, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "public/vo/cache"
VOICE, MODEL = "YgjXqgzBJa9op0K278OW", "eleven_v4"
PAUZE = 0.35


def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige: body["previous_text"] = vorige
    if volgende: body["next_text"] = volgende
    h = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        hdr = {"Content-Type": "application/json"}
        if os.environ.get("ELEVENLABS_API_KEY"): hdr["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
                                     data=json.dumps(body).encode(), headers=hdr)
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.loads(r.read()); rid = r.headers.get("request-id", "")
        data["request_id"] = rid; data["request"] = {k: v for k, v in body.items()}
        CACHE.mkdir(parents=True, exist_ok=True); pad.write_text(json.dumps(data))
        print("gegenereerd:", tekst[:60])
    data = json.loads(pad.read_text())
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists(): mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"], data.get("request_id", ""), h


def woorden(al):
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur: uit.append([round(s, 3), round(e, 3), cur])
            cur, s = "", None; continue
        if s is None: s = cs
        cur += ch; e = ce
    if cur: uit.append([round(s, 3), round(e, 3), cur])
    return uit


def duur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)


def main():
    sc = json.loads((ROOT / "scripts/scripts.json").read_text())
    out, prov = {}, {"voice_id": VOICE, "model_id": MODEL, "items": {}}
    for b, d in sc.items():
        zinnen = d["zinnen"] + [d["cta"]]
        tekst = " ".join(zinnen)
        mp3, al, rid, h = tts(tekst, volgende="")
        ws = woorden(al)
        idx, n = [], 0
        for z in zinnen:
            idx.append(n); n += len(z.split())
        assert n == len(ws), (b, n, len(ws))
        starts = [ws[i][0] for i in idx]
        bd = duur(mp3)
        subprocess.run(["cp", str(mp3), str(ROOT / f"public/vo/{b}-body.mp3")], check=True)
        prov["items"][f"{b}-body"] = {"request_id": rid, "cache": h}
        out[b] = {"body": ws, "bodyDur": bd, "sceneStart": starts, "hooks": {}}
        for i, hk in enumerate(d["hooks"], 1):
            hm, hal, rid, h = tts(hk, volgende=zinnen[0])
            hw = woorden(hal)
            subprocess.run(["cp", str(hm), str(ROOT / f"public/vo/{b}-h{i}.mp3")], check=True)
            out[b]["hooks"][str(i)] = {"words": hw, "dur": duur(hm)}
            prov["items"][f"{b}-h{i}"] = {"request_id": rid, "cache": h}
        print(b, f"body {bd:.1f}s", [round(v["dur"], 1) for v in out[b]["hooks"].values()])
    out["pauze"] = PAUZE
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps(out, ensure_ascii=False))
    (ROOT / "scripts/vo-provenance.json").write_text(json.dumps(prov, indent=1))


if __name__ == "__main__":
    main()

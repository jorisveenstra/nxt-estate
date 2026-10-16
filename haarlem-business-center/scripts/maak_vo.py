"""
Maakt de voice-overs met ElevenLabs (stem YgjXqgzBJa9op0K278OW, model eleven_v4, expliciet in de body).
Per body: body + CTA één keer, per hook alleen de hook; per video hook + pauze + body aan elkaar.
Alle ElevenLabs-antwoorden (incl. request-ids) staan in scripts/tts-cache/. Authenticatie loopt via de
proxy (xi-api-key wordt door het netwerk ingevoegd); lokaal kan ELEVENLABS_API_KEY in de omgeving staan.
Gebruik: python3 scripts/maak_vo.py
"""
import base64, hashlib, json, os, subprocess, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
PAUZE = 0.45
UITSPRAAK = {"HR++": "H R plus plus", "24/7": "24 uur per dag, 7 dagen per week", "A9": "A 9", "A5": "A 5", "A2": "A 2", "A10": "A 10", "m²": "vierkante meter"}


def spreek(t):
    for a, b in UITSPRAAK.items():
        t = t.replace(a, b)
    return t


def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige: body["previous_text"] = vorige
    if volgende: body["next_text"] = volgende
    h = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        headers = {"Content-Type": "application/json"}
        if os.environ.get("ELEVENLABS_API_KEY"): headers["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
                                     data=json.dumps(body).encode(), headers=headers)
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.loads(r.read()); rid = r.headers.get("request-id")
        data["_meta"] = {"model_id": MODEL, "voice_id": VOICE, "request_id": rid, "text": tekst}
        CACHE.mkdir(exist_ok=True); pad.write_text(json.dumps(data))
        print("  gegenereerd:", tekst[:60])
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
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)


def tokens_naar_tekst(orig_woorden, al_woorden):
    """Koppelt elk scriptwoord aan de uitgesproken woorden (uitspraak kan 1 woord in meer woorden splitsen)."""
    uit, k = [], 0
    for w in orig_woorden:
        n = len(spreek(w).split())
        stuk = al_woorden[k:k + n]; k += n
        if not stuk: stuk = [[uit[-1]["e"], uit[-1]["e"] + 0.2, w]] if uit else [[0, 0.2, w]]
        uit.append({"t": w, "s": stuk[0][0], "e": stuk[-1][1]})
    return uit


def main():
    sc = json.loads((ROOT / "scripts/scripts.json").read_text())
    alle, tim = {}, {}
    (ROOT / "public/vo").mkdir(exist_ok=True)
    for b, d in sc.items():
        body_tekst = spreek(" ".join([z for _, z in d["zinnen"]] + d["cta"]))
        bm, bal = tts(body_tekst, vorige=spreek(d["hooks"][0]))
        scen, k, bw = [], 0, woorden(bal, 0)
        for sid, z in [(s, z) for s, z in d["zinnen"]] + [(f"c{i+1}", c) for i, c in enumerate(d["cta"])]:
            ws = z.split(); n = sum(len(spreek(w).split()) for w in ws)
            wl = tokens_naar_tekst(ws, bw[k:k + n]); k += n
            scen.append({"id": sid, "start": wl[0]["s"], "end": wl[-1]["e"], "words": wl})
        tim[b] = {"scenes": scen, "end": scen[-1]["end"]}
        for h, hook in enumerate(d["hooks"], 1):
            key = f"{b}h{h}"
            hm, hal = tts(spreek(hook), volgende=body_tekst[:300])
            hd = duur(hm)
            pauze = -(-int((hd + PAUZE) * 30 * 1000) // 1000) / 30 - hd  # hook-deel eindigt op een heel frame
            if (hd + pauze) * 30 % 1 > 1e-6: pauze = (int((hd + PAUZE) * 30) + 1) / 30 - hd
            alle[key] = woorden(hal, 0) + woorden(bal, hd + pauze)
            uit = ROOT / f"public/vo/{key}.wav"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(hm), "-i", str(bm), "-filter_complex",
                            f"[0]apad=pad_dur={pauze:.5f}[a];[a][1]concat=n=2:v=0:a=1,loudnorm=I=-14:TP=-1:LRA=9", "-ar", "48000", str(uit)], check=True)
            tim[key] = {"hookEnd": round(hd + pauze, 4), "words": tokens_naar_tekst(hook.split(), woorden(hal, 0))}
            print(f"{key}: hook {hd:.1f}s + body {duur(bm):.1f}s -> {duur(uit):.1f}s")
    (ROOT / "src/timing.json").write_text(json.dumps(tim, ensure_ascii=False))
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps(alle, ensure_ascii=False))


if __name__ == "__main__":
    main()

"""ElevenLabs eleven_v4 voice-over (stem YgjXqgzBJa9op0K278OW). Body+CTA 1x, per hook alleen de hook.
Schrijft public/vo/*.mp3, src/timing.json en scripts/vo-provenance.json (zonder sleutels).
Auth: proxy-geinjecteerd xi-api-key (geen lokale sleutel nodig)."""
import base64, json, sys, urllib.request, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
VOICE, MODEL, PAUZE = "YgjXqgzBJa9op0K278OW", "eleven_v4", 0.35
UIT = {"m²": "vierkante meter", "80%": "tachtig procent", "€ 474.950": "vierhonderdvierenzeventigduizend negenhonderdvijftig euro",
       "105": "honderdvijf", "2027,": "tweeduizend zevenentwintig,"}
CACHE = ROOT / "scripts/tts-cache"; CACHE.mkdir(exist_ok=True)

def segs(tekst):
    tekst = tekst.replace("€ 474.950", "€_474.950")
    out = []
    for w in tekst.split():
        w = w.replace("€_474.950", "€ 474.950")
        out.append((w, UIT.get(w, w)))
    return out

def tts(naam, sg, vorige="", volgende=""):
    p = CACHE / f"{naam}.json"
    if not p.exists():
        body = {"text": " ".join(s for _, s in sg), "model_id": MODEL, "language_code": "nl"}
        if vorige: body["previous_text"] = vorige
        if volgende: body["next_text"] = volgende
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            json.dumps(body).encode(), {"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=300) as r:
            hdr = {k.lower(): v for k, v in r.headers.items()}
            data = json.loads(r.read())
        data["_headers"] = {k: hdr[k] for k in ("request-id", "character-cost") if k in hdr}
        data["_model"], data["_voice"] = MODEL, VOICE
        p.write_text(json.dumps(data)); print("gegenereerd", naam, data["_headers"], flush=True)
    d = json.loads(p.read_text())
    (ROOT / f"public/vo/{naam}.mp3").write_bytes(base64.b64decode(d["audio_base64"]))
    return d

def woorden(al):
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur: uit.append([s, e, cur])
            cur, s = "", None; continue
        if s is None: s = cs
        cur += ch; e = ce
    if cur: uit.append([s, e, cur])
    return uit

def koppel(sg, wd, offset):
    i, res = 0, []
    for disp, sp in sg:
        n = len(sp.split()); grp = wd[i:i + n]; i += n
        res.append({"t": disp, "s": round(grp[0][0] + offset, 3), "e": round(grp[-1][1] + offset, 3)})
    assert i == len(wd), (i, len(wd))
    return res

def duur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)

def main():
    sc = json.loads((ROOT / "scripts/scripts.json").read_text())
    bsg = [(s, segs(z)) for s, z in [(k, t) for k, t in sc["body"]]]
    allseg = [x for _, g in bsg for x in g]
    bd = tts("body", allseg, vorige=sc["hooks"][0])
    bw = koppel(allseg, woorden(bd["alignment"]), 0)
    # zinindeling body: per zin begin/eind
    zin, k = [], 0
    for sid, g in bsg:
        zin.append({"id": sid, "from": k, "to": k + len(g)}); k += len(g)
    timing = {"body": {"words": bw, "sentences": zin, "dur": duur(ROOT / "public/vo/body.mp3")}, "hooks": [], "pause": PAUZE}
    prov = {"model_id": MODEL, "voice_id": VOICE, "requests": {"body": bd["_headers"]}}
    for h, hk in enumerate(sc["hooks"], 1):
        hs = segs(hk)
        hd = tts(f"hook{h}", hs, volgende=" ".join(s for _, s in allseg)[:300])
        timing["hooks"].append({"words": koppel(hs, woorden(hd["alignment"]), 0), "dur": duur(ROOT / f"public/vo/hook{h}.mp3")})
        prov["requests"][f"hook{h}"] = hd["_headers"]
    (ROOT / "src/timing.json").write_text(json.dumps(timing, ensure_ascii=False))
    (ROOT / "scripts/vo-provenance.json").write_text(json.dumps(prov, indent=1))
    print("body", timing["body"]["dur"], [round(h["dur"], 1) for h in timing["hooks"]])

main()

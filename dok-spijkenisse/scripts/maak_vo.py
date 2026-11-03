"""Voice-overs via ElevenLabs Eleven v4 (met woordtiming) + usage-registratie bij de portal.
Gebruik: python3 scripts/maak_vo.py   (leest scripts.json; schrijft public/vo/*.mp3 en src/timing.json)
Elke aanroep wordt precies één keer betaald: resultaten staan in scripts/tts-cache en
de verzoek-ID's in scripts/provenance.json."""
import base64, json, hashlib, os, re, sys, subprocess
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
CACHE = ROOT / "scripts/tts-cache"; CACHE.mkdir(exist_ok=True)
OUT = ROOT / "public/vo"; OUT.mkdir(exist_ok=True, parents=True)
MODEL = "eleven_v4"
S = json.loads((ROOT / "scripts/scripts.json").read_text())
VOICE = S["voice_id"]

# spreektekst (één woord blijft één woord, zodat de woordtiming klopt); weergave via WEERGAVE
SPREEK = {"189.500": "honderdnegenentachtigduizendvijfhonderd", "A15": "A-vijftien", "N218": "N-tweehonderdachttien"}
WEERGAVE = {v: k for k, v in SPREEK.items()}


def spreek(t):
    for a, b in SPREEK.items():
        t = t.replace(a, b)
    return t


def bridge():
    from portal_bridge import PortalBridge
    b = PortalBridge(os.environ["JOB_URL"], os.environ["JOB_TOKEN"], ["https://portal.nxt-estate.com"])
    b.run_id = os.environ["RUN_ID"]
    return b


def tts(tekst, label, br):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    h = hashlib.sha1(json.dumps([VOICE, body], sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.loads(r.read()); hdr = {k.lower(): v for k, v in r.headers.items()}
        data["_headers"] = {k: v for k, v in hdr.items() if k in ("request-id", "character-cost", "x-request-id")}
        data["_model"] = MODEL; data["_voice"] = VOICE; data["_label"] = label
        pad.write_text(json.dumps(data))
        print("gegenereerd", label, data["_headers"], flush=True)
    data = json.loads(pad.read_text())
    if br and not data.get("_gemeld"):
        hdr = data["_headers"]
        rid = hdr.get("request-id") or hdr.get("x-request-id") or h
        br.record_elevenlabs("voiceover", MODEL, rid, headers=hdr, characters=len(tekst) if "character-cost" not in hdr else None)
        data["_gemeld"] = True; pad.write_text(json.dumps(data))
    mp3 = OUT / f"{label}.mp3"
    mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return data


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


def dur(mp3):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)]))


if __name__ == "__main__":
    br = bridge() if os.environ.get("JOB_URL") else None
    timing = {}
    for b in ("b1", "b2", "b3"):
        zin = S[b]["zinnen"]
        spoken = [spreek(z[1]) for z in zin]
        data = tts(" ".join(spoken), f"{b}-body", br)
        w = woorden(data["alignment"])
        # woorden -> zinnen
        scenes, i = [], 0
        for (sid, _), sp in zip(zin, spoken):
            n = len(sp.split())
            ws = [[a, c, WEERGAVE.get(t, t)] for a, c, t in w[i:i + n]]
            scenes.append({"id": sid, "words": ws, "start": ws[0][0], "end": ws[-1][1]})
            i += n
        assert i == len(w), (b, i, len(w))
        timing[b] = {"body": {"duration": dur(OUT / f"{b}-body.mp3"), "scenes": scenes}, "hooks": {}}
        for k, ht in enumerate(S[b]["hooks"], 1):
            d = tts(ht, f"{b}-hook{k}", br)
            timing[b]["hooks"][str(k)] = {"duration": dur(OUT / f"{b}-hook{k}.mp3"), "words": woorden(d["alignment"])}
    (ROOT / "src/timing.json").write_text(json.dumps(timing, ensure_ascii=False, indent=1))
    prov = {}
    for p in sorted(CACHE.glob("*.json")):
        d = json.loads(p.read_text()); prov[d["_label"]] = {"model_id": d["_model"], "voice_id": d["_voice"], **d["_headers"]}
    (ROOT / "scripts/provenance.json").write_text(json.dumps(prov, indent=1))

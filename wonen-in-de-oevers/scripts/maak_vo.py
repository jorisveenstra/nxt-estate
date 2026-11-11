"""Voice-overs via ElevenLabs (stem YgjXqgzBJa9op0K278OW, model eleven_v4 expliciet), per tekens getimed.
Body+CTA één keer per body, per hook alleen de hook; per video hook + pauze + body samengevoegd.
Authenticatie loopt via het netwerk-secret van de omgeving (geen sleutel in bestanden).
Cache: scripts/tts-cache (antwoord + request-id + character-cost, geen credentials)."""
import base64, hashlib, json, subprocess, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"; CACHE.mkdir(exist_ok=True)
VOICE, MODEL, PAUZE = "YgjXqgzBJa9op0K278OW", "eleven_v4", 0.35
UITSPRAAK = {"592.500": "vijfhonderdtweeënnegentigduizend vijfhonderd", "605.000": "zeshonderdvijfduizend", "129": "honderdnegenentwintig", "155": "honderdvijfenvijftig", "172": "honderdtweeënzeventig"}
# Ongewijzigde hooks uit de vorige versie (eleven_v4, zelfde stem; zie provenance/narration-requests.json) worden hergebruikt.
VORIG = json.loads((ROOT/"scripts/scripts-vorige.json").read_text())
OUD = json.loads((ROOT/"scripts/woorden-tts.json").read_text())
def spreek(t):
    for a, b in UITSPRAAK.items(): t = t.replace(a, b)
    return t
def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige: body["previous_text"] = vorige
    if volgende: body["next_text"] = volgende
    h = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    p = CACHE / f"{h}.json"
    if not p.exists():
        hdr = CACHE / f"{h}.hdr"
        out = subprocess.check_output(["curl","-sS","-m","300","-D",str(hdr),"-X","POST","-H","Content-Type: application/json","-d",json.dumps(body),
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128"])
        data = json.loads(out)
        if "audio_base64" not in data: sys.exit("TTS fout: " + str(data)[:300])
        hd = {l.split(":",1)[0].strip().lower(): l.split(":",1)[1].strip() for l in hdr.read_text().splitlines() if ":" in l}
        data["_meta"] = {"request_id": hd.get("request-id"), "character_cost": hd.get("character-cost"), "characters": len(tekst), "model_id": MODEL, "voice_id": VOICE}
        hdr.unlink(); p.write_text(json.dumps(data)); print("gegenereerd", data["_meta"], flush=True)
    data = json.loads(p.read_text()); mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists(): mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"]
def woorden(al, off):
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur: uit.append([round(s+off,3), round(e+off,3), cur])
            cur, s = "", None; continue
        if s is None: s = cs
        cur += ch; e = ce
    if cur: uit.append([round(s+off,3), round(e+off,3), cur])
    return uit
def duur(p): return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(p)]))
def main():
    sc = json.loads((ROOT/"scripts/scripts.json").read_text()); alle = {}; (ROOT/"public/vo").mkdir(exist_ok=True)
    for b, d in sc.items():
        bt = spreek(" ".join([z for _, z in d["zinnen"]] + [d["cta"]]))
        bm, ba = tts(bt, vorige=spreek(d["hooks"][0]))
        (ROOT/f"public/vo/body{b}.wav").unlink(missing_ok=True)
        subprocess.check_call(["ffmpeg","-v","error","-y","-i",str(bm),"-af","loudnorm=I=-14:TP=-1:LRA=9","-ar","48000",str(ROOT/f"public/vo/body{b}.wav")])
        alle[f"b{b}"] = woorden(ba, 0)
        for h, hook in enumerate(d["hooks"], 1):
            if VORIG[b]["hooks"][h-1] == hook and f"b{b}h{h}" in OUD and (ROOT/f"public/vo/b{b}h{h}-hook.wav").exists():
                alle[f"b{b}h{h}"] = OUD[f"b{b}h{h}"]; print(f"b{b}h{h}: hergebruikt", flush=True); continue
            hm, ha = tts(spreek(hook), volgende=bt[:300])
            subprocess.check_call(["ffmpeg","-v","error","-y","-i",str(hm),"-af","loudnorm=I=-14:TP=-1:LRA=9","-ar","48000",str(ROOT/f"public/vo/b{b}h{h}-hook.wav")])
            alle[f"b{b}h{h}"] = woorden(ha, 0)
            print(f"b{b}h{h}: hook {duur(ROOT/f'public/vo/b{b}h{h}-hook.wav'):.2f}s, body {duur(ROOT/f'public/vo/body{b}.wav'):.2f}s", flush=True)
    (ROOT/"scripts/woorden-tts.json").write_text(json.dumps(alle, ensure_ascii=False))
main()

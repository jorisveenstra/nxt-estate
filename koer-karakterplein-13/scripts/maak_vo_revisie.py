"""Revisie 1 (feedback: ca. 225 m2, veel slaapkamers, vrijblijvend kijkafspraak): nieuwe body+CTA-voice-over per body via
ElevenLabs eleven_v4 (voice YgjXqgzBJa9op0K278OW, expliciet). De hooks zijn ongewijzigd en worden hergebruikt uit de eerdere
eleven_v4-voice-overs (provenance: scripts/vo_provenance.json): het hookdeel (0 .. body_start uit scripts/timing_v1.json) wordt uit
public/vo/b<b>h<h>.mp3 van versie 1 geknipt en bewaard in public/vo/hooks/.
Antwoorden gecachet in scripts/tts-cache (nooit twee keer betalen). Authenticatie via de netwerk-proxy; geen sleutel in de repo.
Gebruik: python3 scripts/maak_vo_revisie.py"""
import base64, hashlib, json, subprocess
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"; CACHE.mkdir(exist_ok=True)
VOICE, MODEL = "YgjXqgzBJa9op0K278OW", "eleven_v4"
PROV = ROOT / "scripts/vo_provenance.json"
prov = json.loads(PROV.read_text()) if PROV.exists() else {}
OLD = json.loads((ROOT / "scripts/timing_v1.json").read_text())
HOOKS = ROOT / "public/vo/hooks"; HOOKS.mkdir(parents=True, exist_ok=True)


def tts(tekst, vorige=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige:
        body["previous_text"] = vorige
    h = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        marker = CACHE / f"{h}.pending"
        if marker.exists():
            raise SystemExit(f"Onzekere eerdere aanvraag {h}: niet blind herhalen, eerst controleren")
        marker.write_text("pending")
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers={"xi-api-key": "proxy-injected", "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.loads(r.read()); hd = {k.lower(): v for k, v in r.headers.items()}
        pad.write_text(json.dumps(data))
        marker.unlink()
        prov[h] = {"model_id": MODEL, "voice_id": VOICE, "request_id": hd.get("request-id"),
                   "character_cost": hd.get("character-cost"), "characters": len(tekst), "text_start": tekst[:50], "revisie": 1}
        PROV.write_text(json.dumps(prov, indent=1, ensure_ascii=False))
        print("gegenereerd", len(tekst), tekst[:50], hd.get("request-id"), hd.get("character-cost"), flush=True)
    data = json.loads(pad.read_text()); mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists():
        mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"]


def woorden(al, offset):
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                uit.append([round(s + offset, 3), round(e + offset, 3), cur])
            cur, s = "", None; continue
        if s is None:
            s = cs
        cur += ch; e = ce
    if cur:
        uit.append([round(s + offset, 3), round(e + offset, 3), cur])
    return uit


def duur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                                capture_output=True, text=True).stdout)


scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
alle = {}
for b, d in scripts.items():
    zinnen = d["body"] + [d["cta"]]
    body_tekst = " ".join(zinnen)
    bm, bal = tts(body_tekst, vorige=d["hooks"][0])
    bw = woorden(bal, 0)
    n, starts = 0, []
    for z in zinnen:
        starts.append(bw[n][0]); n += len(z.split())
    assert n == len(bw), (b, n, len(bw))
    for h in range(1, len(d["hooks"]) + 1):
        key = f"b{b}h{h}"
        old = OLD[key]
        sb = old["body_start"]
        hook_mp3 = HOOKS / f"{key}.mp3"
        if not hook_mp3.exists():
            # hookdeel uit de eerdere (eleven_v4) voice-over, inclusief de korte pauze tot het begin van de body
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(ROOT / f"public/vo/{key}.mp3"), "-af",
                            f"atrim=0:{sb},afade=t=out:st={max(0, sb - 0.12):.3f}:d=0.12", "-ar", "48000", "-b:a", "192k", str(hook_mp3)], check=True)
        uit = ROOT / f"public/vo/{key}.mp3"
        tmp = ROOT / f"public/vo/{key}.tmp.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(hook_mp3), "-i", str(bm), "-filter_complex",
                        f"[0]apad=whole_dur={sb}[a];[1]aresample=48000[c];[a][c]concat=n=2:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=9",
                        "-ar", "48000", "-b:a", "192k", str(tmp)], check=True)
        tmp.replace(uit)
        alle[key] = {"hook": old["hook"], "hook_end": old["hook_end"], "body_start": sb, "body": woorden(bal, sb),
                     "zin_start": [round(s + sb, 3) for s in starts], "end": round(duur(uit), 3)}
        print(key, "totaal", alle[key]["end"], flush=True)
(ROOT / "src/timing.json").write_text(json.dumps(alle, ensure_ascii=False))

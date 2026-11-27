"""
Voice-overs voor Elbe 23 Den Haag via ElevenLabs: stem YgjXqgzBJa9op0K278OW, model eleven_v4 (verplicht).

Body + CTA wordt één keer ingesproken, elke hook apart; per video hook + pauze + body.
Authenticatie: de cloud-omgeving injecteert de xi-api-key voor api.elevenlabs.io (network secret).
Lokaal mag ELEVENLABS_API_KEY in ~/.elevenlabs staan. Er wordt nooit een sleutel weggeschreven.

Provenance (model, stem, request-id, character-cost) gaat naar scripts/vo-provenance.json.
Antwoorden staan in scripts/tts-cache/ zodat dezelfde tekst nooit twee keer credits kost.
"""
import base64, hashlib, json, subprocess, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
PROV = ROOT / "scripts/vo-provenance.json"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
PAUZE = 0.4

UITSPRAAK = [
    ("200 tot 230 m²", "tweehonderd tot tweehonderddertig vierkante meter"),
    ("117 m²", "honderdzeventien vierkante meter"),
    ("A12", "A twaalf"), ("A4", "A vier"),
    ("Elbe 23", "Elbe drieëntwintig"),
    ("2 tot en met 6", "twee tot en met zes"),
    ("2027", "tweeduizend zevenentwintig"),
]


def spreektekst(t):
    for a, b in UITSPRAAK:
        t = t.replace(a, b)
    return t


def headers():
    h = {"Content-Type": "application/json"}
    f = Path.home() / ".elevenlabs"
    if f.exists():
        for r in f.read_text().splitlines():
            if r.startswith("ELEVENLABS_API_KEY="):
                h["xi-api-key"] = r.split("=", 1)[1].strip()
    return h  # anders voegt de proxy de sleutel toe


def tts(naam, tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}}
    if vorige: body["previous_text"] = vorige
    if volgende: body["next_text"] = volgende
    h = hashlib.sha1(json.dumps([VOICE, body], sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    prov = json.loads(PROV.read_text()) if PROV.exists() else {}
    if not pad.exists():
        if h in prov and not prov[h].get("done"):
            raise SystemExit(f"{naam}: eerdere aanvraag met onzekere uitkomst; niet blind herhalen")
        prov[h] = {"naam": naam, "model_id": MODEL, "voice_id": VOICE, "chars": len(tekst), "done": False}
        PROV.write_text(json.dumps(prov, indent=1, ensure_ascii=False))
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers=headers(), method="POST")
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                data = json.loads(r.read())
                rh = {k.lower(): v for k, v in r.headers.items()}
        except urllib.error.HTTPError as e:
            prov[h].update(done=True, error=f"HTTP {e.code}: {e.read(500).decode(errors='replace')}")
            PROV.write_text(json.dumps(prov, indent=1, ensure_ascii=False))
            raise SystemExit(f"{naam}: ElevenLabs weigerde ({e.code})")
        CACHE.mkdir(exist_ok=True)
        pad.write_text(json.dumps(data))
        prov[h].update(done=True, request_id=rh.get("request-id"), character_cost=rh.get("character-cost"),
                       history_item_id=rh.get("history-item-id"),
                       headers={k: rh[k] for k in ("request-id", "character-cost", "history-item-id") if k in rh})
        PROV.write_text(json.dumps(prov, indent=1, ensure_ascii=False))
        print(f"  {naam}: gegenereerd ({len(tekst)} tekens, cost {rh.get('character-cost')})")
    data = json.loads(pad.read_text())
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists():
        mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"]


def woorden(al, offset):
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur: uit.append([round(s + offset, 3), round(e + offset, 3), cur])
            cur, s = "", None
            continue
        if s is None: s = cs
        cur += ch; e = ce
    if cur: uit.append([round(s + offset, 3), round(e + offset, 3), cur])
    return uit


def duur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                                capture_output=True, text=True).stdout)


def main():
    import sys
    alleen = sys.argv[1:]  # optioneel: alleen deze onderdelen (bv. body) genereren
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    (ROOT / "public/vo").mkdir(parents=True, exist_ok=True)
    out = {}
    for b, d in scripts.items():
        body_tekst = spreektekst(" ".join(z for _, z in d["zinnen"]))
        body_mp3, body_al = tts(f"{b}-body", body_tekst, vorige=spreektekst(d["hooks"][0]))
        if alleen == ["body"]:
            return
        bd = duur(body_mp3)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(body_mp3), "-af", "loudnorm=I=-15:TP=-1.5:LRA=9",
                        "-ar", "48000", str(ROOT / f"public/vo/{b}-body.wav")], check=True)
        for i, hook in enumerate(d["hooks"], 1):
            hook_mp3, hook_al = tts(f"{b}h{i}", spreektekst(hook), volgende=body_tekst[:300])
            hd = duur(hook_mp3)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(hook_mp3), "-af",
                            "loudnorm=I=-15:TP=-1.5:LRA=9", "-ar", "48000", str(ROOT / f"public/vo/{b}h{i}.wav")], check=True)
            out[f"{b}h{i}"] = {"hookDur": round(hd, 3), "hook": woorden(hook_al, 0)}
            print(f"{b}h{i}: hook {hd:.2f}s")
        out[b] = {"bodyDur": round(bd, 3), "body": woorden(body_al, 0)}
        print(f"{b}: body {bd:.2f}s")
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()

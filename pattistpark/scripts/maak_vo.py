"""
Maakt de voice-overs met ElevenLabs (stem YgjXqgzBJa9op0K278OW, model eleven_v4, expliciet in elk verzoek).

Per body wordt de body + CTA één keer gegenereerd en per hook alleen de hook; daarna wordt per video
hook + korte pauze + body aan elkaar geplakt. ElevenLabs levert de timing per teken mee; daaruit komt
scripts/woorden-tts.json (timing per scriptwoord) voor src/timing.json.

Antwoorden staan in scripts/tts-cache/ (met model_id, voice_id en request-id's in scripts/vo-herkomst.json),
zodat dezelfde tekst nooit twee keer credits kost. Authenticatie loopt via de omgeving (geen sleutel in de repo).
"""
import base64, hashlib, json, subprocess, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
PAUZE = 0.45  # seconden tussen hook en body

# In beeld staat het cijfer; de stem krijgt het uitgeschreven
UITSPRAAK = {"2027,": "tweeduizend zevenentwintig,", "2027": "tweeduizend zevenentwintig", "309.950": "driehonderdnegenduizend negenhonderdvijftig"}


def spreek(woord):
    return UITSPRAAK.get(woord, woord)


def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige:
        body["previous_text"] = vorige
    if volgende:
        body["next_text"] = volgende
    h = hashlib.sha1(json.dumps({**body, "voice": VOICE}, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.loads(r.read())
            rid = r.headers.get("request-id")
        data["herkomst"] = {"model_id": MODEL, "voice_id": VOICE, "request_id": rid, "tekst": tekst}
        CACHE.mkdir(exist_ok=True)
        pad.write_text(json.dumps(data))
        print(f"  gegenereerd ({len(tekst)} tekens): {tekst[:60]}…")
    data = json.loads(pad.read_text())
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists():
        mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"], data["herkomst"]


def spreekwoorden(al, offset):
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                uit.append([s + offset, e + offset, cur])
            cur, s = "", None
            continue
        if s is None:
            s = cs
        cur += ch
        e = ce
    if cur:
        uit.append([s + offset, e + offset, cur])
    return uit


def schriftwoorden(tekst_zinnen, gesproken):
    """Koppelt de scriptwoorden (in beeld) aan de gesproken woorden; uitgeschreven cijfers worden samengevoegd."""
    uit, i = [], 0
    for sid, zin in tekst_zinnen:
        for w in zin.split():
            n = len(spreek(w).split())
            blok = gesproken[i:i + n]
            i += n
            uit.append((sid, w, round(blok[0][0], 3), round(blok[-1][1], 3)))
    assert i == len(gesproken), (i, len(gesproken))
    return uit


def duur(pad):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(pad)], capture_output=True, text=True).stdout)


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    alle, herkomst = {}, []
    (ROOT / "public/vo").mkdir(parents=True, exist_ok=True)
    for b, data in scripts.items():
        body_zinnen = [tuple(z) for z in data["zinnen"]]
        body_tekst = " ".join(spreek(w) for _, z in body_zinnen for w in z.split())
        body_mp3, body_al, hb = tts(body_tekst, vorige=data["hooks"][0])
        herkomst.append(hb)
        body_w = spreekwoorden(body_al, 0)
        for h, hook in enumerate(data["hooks"], start=1):
            key = f"{b}h{h}"
            hook_mp3, hook_al, hh = tts(hook, volgende=body_tekst[:300])
            herkomst.append(hh)
            hd = duur(hook_mp3)
            start_body = hd + PAUZE
            gesproken = spreekwoorden(hook_al, 0) + [[s + start_body, e + start_body, t] for s, e, t in body_w]
            zinnen = [("hook", hook)] + list(body_zinnen)
            alle[key] = schriftwoorden(zinnen, gesproken)
            uit = ROOT / f"public/vo/{key}.wav"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(hook_mp3), "-i", str(body_mp3), "-filter_complex",
                            f"[0]apad=pad_dur={PAUZE}[a];[a][1]concat=n=2:v=0:a=1,loudnorm=I=-14:TP=-1:LRA=9", "-ar", "48000", str(uit)], check=True)
            print(f"{key}: hook {hd:.1f}s + body {duur(body_mp3):.1f}s -> {duur(uit):.1f}s")
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps(alle, ensure_ascii=False))
    (ROOT / "scripts/vo-herkomst.json").write_text(json.dumps(herkomst, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()

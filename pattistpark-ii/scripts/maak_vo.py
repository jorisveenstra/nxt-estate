"""
Maakt de voice-overs voor Pattistpark II met ElevenLabs (stem YgjXqgzBJa9op0K278OW "Tijs",
model eleven_v4, expliciet; nooit een ander model of providerdefault).

Per body wordt body + CTA één keer gegenereerd en per hook alleen de hook. Beide met
/with-timestamps, zodat de timing per woord direct uit de TTS komt.

- Cache: scripts/tts-cache/<hash>.json (antwoord) + <hash>.meta.json (model, stem, request-id,
  character-cost, tekst). Dezelfde tekst kost dus nooit twee keer credits.
- Vóór elk verzoek wordt <hash>.pending geschreven. Staat die er nog (onzekere uitkomst), dan
  wordt NIET automatisch opnieuw betaald: los eerst handmatig op.
- Sleutel: geen sleutel in deze repo. In de cloud injecteert de proxy xi-api-key; lokaal kan
  ELEVENLABS_API_KEY in ~/.elevenlabs staan.

Uitvoer: scripts/woorden.json met per body/hook de weergavewoorden met tijden en zinsgrenzen,
public/vo/body<b>.wav en public/vo/hook<b>-<h>.wav (48 kHz).

Gebruik: python3 scripts/maak_vo.py
"""
import base64
import hashlib
import json
import re
import subprocess
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"

# Uitspraak per weergavewoord (zonder leestekens): wat in beeld staat -> wat de stem zegt
UITSPRAAK = {
    "II": "twee",
    "A+++": "A plus plus plus",
    "484.950": "vierhonderdvierentachtigduizend negenhonderdvijftig",
    "37,7": "zevenendertig komma zeven",
    "105": "honderdvijf",
    "202": "tweehonderdtwee",
    "24": "vierentwintig",
    "38": "achtendertig",
    "2027": "tweeduizend zevenentwintig",
}
LEESTEKEN = re.compile(r"^(.*?)([.,?!:;]*)$")


def sleutel():
    pad = Path.home() / ".elevenlabs"
    if pad.exists():
        for regel in pad.read_text().splitlines():
            if regel.startswith("ELEVENLABS_API_KEY="):
                return regel.split("=", 1)[1].strip()
    return None  # cloud: proxy injecteert de sleutel


def naar_spraak(zin):
    """Weergavewoorden -> (spreektekst, aantal gesproken woorden per weergavewoord)."""
    gesproken, aantallen = [], []
    for w in zin.split():
        kern, punt = LEESTEKEN.match(w).groups()
        if kern in UITSPRAAK:
            delen = UITSPRAAK[kern].split()
            delen[-1] += punt
        else:
            delen = [w]
        gesproken += delen
        aantallen.append(len(delen))
    return " ".join(gesproken), aantallen


def tts(tekst):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    h = hashlib.sha1(json.dumps({**body, "voice": VOICE}, sort_keys=True).encode()).hexdigest()[:16]
    pad, meta, pending = CACHE / f"{h}.json", CACHE / f"{h}.meta.json", CACHE / f"{h}.pending"
    if not pad.exists():
        if pending.exists():
            raise SystemExit(f"Onzekere eerdere poging voor {h}; niet blind opnieuw betalen")
        CACHE.mkdir(exist_ok=True)
        pending.write_text(tekst)
        headers = {"Content-Type": "application/json"}
        if sleutel():
            headers["xi-api-key"] = sleutel()
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                data = json.loads(r.read())
                hdr = {k.lower(): v for k, v in r.headers.items()}
        except urllib.error.HTTPError as e:
            pending.unlink()  # definitieve weigering: niets gegenereerd
            raise SystemExit(f"ElevenLabs weigerde TTS ({e.code}): {e.read(500)!r}")
        meta.write_text(json.dumps({
            "model_id": MODEL, "voice_id": VOICE, "text": tekst,
            "request_id": hdr.get("request-id"), "history_item_id": hdr.get("history-item-id"),
            "character_cost": hdr.get("character-cost"),
            "headers": {k: hdr[k] for k in ("request-id", "character-cost", "history-item-id") if k in hdr},
        }, ensure_ascii=False))
        pad.write_text(json.dumps(data))
        pending.unlink()
        print(f"  gegenereerd ({len(tekst)} tekens): {tekst[:60]}…", flush=True)
    data = json.loads(pad.read_text())
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists():
        mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"], h


def woorden_tts(al):
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                uit.append([s, e, cur])
            cur, s = "", None
            continue
        if s is None:
            s = cs
        cur += ch
        e = ce
    if cur:
        uit.append([s, e, cur])
    return uit


def koppel(zinnen, al):
    """Gesproken woordtijden terug naar weergavewoorden, per zin."""
    tts_w = woorden_tts(al)
    i, uit = 0, []
    for zin in zinnen:
        _, aantallen = naar_spraak(zin)
        ws = []
        for w, n in zip(zin.split(), aantallen):
            deel = tts_w[i:i + n]
            i += n
            ws.append({"t": w, "s": round(deel[0][0], 3), "e": round(deel[-1][1], 3)})
        uit.append({"tekst": zin, "s": ws[0]["s"], "e": ws[-1]["e"], "woorden": ws})
    if i != len(tts_w):
        raise SystemExit(f"Woordtelling klopt niet ({i} vs {len(tts_w)}): {zinnen[0][:40]}")
    return uit


def wav(mp3, uit):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-ar", "48000", "-ac", "2", str(uit)], check=True)


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    taken = []
    for b, d in scripts.items():
        zinnen = d["zinnen"] + [d["cta"]]
        taken.append((f"body{b}", zinnen))
        for h, hook in enumerate(d["hooks"], start=1):
            taken.append((f"hook{b}-{h}", [hook]))

    def doe(taak):
        naam, zinnen = taak
        tekst = " ".join(naar_spraak(z)[0] for z in zinnen)
        mp3, al, h = tts(tekst)
        return naam, zinnen, mp3, al, h

    with ThreadPoolExecutor(4) as pool:
        resultaten = list(pool.map(doe, taken))
    (ROOT / "public/vo").mkdir(parents=True, exist_ok=True)
    alle = {}
    for naam, zinnen, mp3, al, h in resultaten:
        wav(mp3, ROOT / f"public/vo/{naam}.wav")
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                    str(ROOT / f"public/vo/{naam}.wav")], capture_output=True, text=True).stdout)
        alle[naam] = {"cache": h, "duur": round(dur, 3), "zinnen": koppel(zinnen, al)}
    (ROOT / "scripts/woorden.json").write_text(json.dumps(alle, ensure_ascii=False, indent=1))
    print("klaar:", len(alle), "voice-overs")


if __name__ == "__main__":
    main()

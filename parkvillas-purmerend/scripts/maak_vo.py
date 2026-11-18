"""
Voice-overs voor Parkvilla's Purmerend via ElevenLabs: stem YgjXqgzBJa9op0K278OW (Tijs), model eleven_v4.

Per body één TTS-aanvraag (alle zinnen + CTA) en per hook één aanvraag, met tijd per teken.
Uitkomst:
  public/vo/hook-b<b>h<h>.mp3, public/vo/body-b<b>.mp3
  scripts/woorden-tts.json  per stuk de woorden (zoals in beeld) met begin/eind en zin-index
  scripts/vo-provenance.json  model_id, voice_id, request-id, character-cost per stuk (geen sleutels)

Authenticatie: op Claude cloud injecteert de netwerk-proxy de xi-api-key voor api.elevenlabs.io.
Lokaal: zet ELEVENLABS_API_KEY in de omgeving. Antwoorden worden gecachet in scripts/tts-cache/,
zodat dezelfde tekst nooit twee keer credits kost.
Gebruik: python3 scripts/maak_vo.py
"""
import base64, hashlib, json, os, re, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"

# Uitspraak per woord (zonder leestekens): wat in beeld staat -> wat de stem zegt (één token)
UITSPRAAK = {
    "137": "honderdzevenendertig",
    "A+++": "A-plus-plus-plus",
    "639.000": "zeshonderdnegenendertigduizend",
    "699.000": "zeshonderdnegenennegentigduizend",
    "2027": "tweeduizendzevenentwintig",
    "A7": "A-zeven",
    "B&B": "bed-and-breakfast",
}


def spreek(woord):
    m = re.match(r"^(.*?)([.,:?!]*)$", woord)
    kern, lt = m.group(1), m.group(2)
    return UITSPRAAK.get(kern, kern) + lt


def tts(stuk, zinnen, vorige="", volgende=""):
    """zinnen: lijst met zinnen (weergavetekst). Geeft woorden [[s,e,woord,zin]] terug."""
    disp = [(w, i) for i, z in enumerate(zinnen) for w in z.split()]
    tekst = " ".join(spreek(w) for w, _ in disp)
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige:
        body["previous_text"] = vorige
    if volgende:
        body["next_text"] = volgende
    h = hashlib.sha1(json.dumps({"v": VOICE, **body}, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        headers = {"Content-Type": "application/json"}
        if os.environ.get("ELEVENLABS_API_KEY"):
            headers["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_192",
            data=json.dumps(body).encode(), headers=headers)
        with urllib.request.urlopen(req, timeout=300) as r:
            hdr = {k.lower(): v for k, v in r.headers.items() if k.lower() in ("request-id", "character-cost", "history-item-id", "x-character-count")}
            data = json.loads(r.read())
        data["_headers"] = hdr
        CACHE.mkdir(exist_ok=True)
        pad.write_text(json.dumps(data))
        print(f"  gegenereerd {stuk} ({len(tekst)} tekens) request-id={hdr.get('request-id')}", flush=True)
    data = json.loads(pad.read_text())
    mp3 = ROOT / f"public/vo/{stuk}.mp3"
    mp3.parent.mkdir(parents=True, exist_ok=True)
    mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    al = data["alignment"]
    gesproken, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                gesproken.append((s, e, cur))
            cur, s = "", None
            continue
        if s is None:
            s = cs
        cur += ch
        e = ce
    if cur:
        gesproken.append((s, e, cur))
    if len(gesproken) != len(disp):
        sys.exit(f"{stuk}: {len(gesproken)} gesproken woorden vs {len(disp)} in beeld")
    woorden = [[round(s, 3), round(e, 3), w, i] for (s, e, _), (w, i) in zip(gesproken, disp)]
    prov = {"stuk": stuk, "model_id": MODEL, "voice_id": VOICE, "text": tekst, "cache": pad.name, **data["_headers"]}
    return stuk, woorden, prov


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    jobs = []
    for b, d in scripts.items():
        body_zinnen = d["zinnen"] + [d["cta"]]
        body_tekst = " ".join(spreek(w) for z in body_zinnen for w in z.split())
        jobs.append((f"body-b{b}", body_zinnen, d["hooks"][0], ""))
        for h, hook in enumerate(d["hooks"], start=1):
            jobs.append((f"hook-b{b}h{h}", [hook], "", body_tekst[:300]))
    with ThreadPoolExecutor(3) as ex:
        res = list(ex.map(lambda j: tts(*j), jobs))
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps({s: w for s, w, _ in res}, ensure_ascii=False))
    (ROOT / "scripts/vo-provenance.json").write_text(json.dumps([p for _, _, p in res], ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

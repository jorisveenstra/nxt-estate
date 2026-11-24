"""
Maakt de voice-overs voor Elbe 23 met ElevenLabs (stem YgjXqgzBJa9op0K278OW, model eleven_v4, expliciet).

Per body wordt body + CTA één keer ingesproken en per hook alleen de hook. Per video wordt daarna
hook + pauze + body samengevoegd (zie scripts/bouw_audio.py). ElevenLabs levert timing per teken,
waaruit scripts/woorden-tts.json (timing per woord, per stuk) wordt opgebouwd.

Elke aanvraag wordt bewaard in scripts/tts-cache/ met provenance (model_id, voice_id, request-id,
character-cost): dezelfde tekst kost nooit twee keer credits. Een aanvraag met onzekere uitkomst
(.pending zonder resultaat) wordt NIET automatisch herhaald.

Authenticatie: in de cloud injecteert een netwerk-secret de xi-api-key voor api.elevenlabs.io.
Lokaal: ELEVENLABS_API_KEY in ~/.elevenlabs. Sleutels komen nooit in deze repo.

Gebruik: python3 scripts/maak_vo.py
"""
import base64
import hashlib
import json
import os
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"

# Uitspraak: woorden in beeld -> wat de stem zegt (één woord blijft één woord, voor de ondertitels)
UITSPRAAK = {
    "A12": "A-twaalf",
    "A4": "A-vier",
    "HR++": "HR-plus-plus",
    "2027": "tweeduizendzevenentwintig",
    "200": "tweehonderd",
    "230": "tweehonderddertig",
    "23": "drieëntwintig",
}


def spreektekst(t):
    uit = []
    for w in t.split(" "):
        kern = w.rstrip(",.:?")
        rest = w[len(kern):]
        uit.append(UITSPRAAK.get(kern, kern) + rest)
    return " ".join(uit)


def sleutel():
    if os.environ.get("ELEVENLABS_API_KEY"):
        return os.environ["ELEVENLABS_API_KEY"]
    p = Path.home() / ".elevenlabs"
    if p.exists():
        for regel in p.read_text().splitlines():
            if regel.startswith("ELEVENLABS_API_KEY="):
                return regel.split("=", 1)[1].strip()
    return None  # netwerk-secret van de cloudomgeving vult de header in


def tts(tekst):
    body = {"text": tekst, "model_id": MODEL}
    h = hashlib.sha1(json.dumps({"voice": VOICE, **body}, sort_keys=True).encode()).hexdigest()[:16]
    pad, meta, pending = CACHE / f"{h}.json", CACHE / f"{h}.meta.json", CACHE / f"{h}.pending"
    if not pad.exists():
        if pending.exists():
            raise SystemExit(f"Onzekere eerdere aanvraag voor {h}; niet blind herhalen. Controleer ElevenLabs-history.")
        CACHE.mkdir(exist_ok=True)
        pending.write_text(json.dumps(body))
        headers = {"Content-Type": "application/json", "User-Agent": "nxt-video-ads/1.0"}
        k = sleutel()
        if k:
            headers["xi-api-key"] = k
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                raw = r.read()
                hdr = {k.lower(): v for k, v in r.headers.items()
                       if k.lower() in ("request-id", "character-cost", "history-item-id", "x-character-count", "content-type")}
        except urllib.error.HTTPError as e:
            # Definitieve afwijzing door de provider: geen media, veilig te melden.
            pending.unlink()
            raise SystemExit(f"ElevenLabs TTS afgewezen ({e.code}): {e.read(500).decode(errors='replace')}")
        data = json.loads(raw)
        pad.write_text(json.dumps(data))
        meta.write_text(json.dumps({"model_id": MODEL, "voice_id": VOICE, "text": tekst,
                                    "characters": len(tekst), "headers": hdr}, ensure_ascii=False, indent=1))
        pending.unlink()
        print(f"  gegenereerd ({len(tekst)} tekens, request {hdr.get('request-id')}): {tekst[:50]}…", flush=True)
    data = json.loads(pad.read_text())
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists():
        mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return h, mp3, data["alignment"]


def woorden(al):
    """Tekens met tijden -> [[start, eind, woord], ...]"""
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                uit.append([round(s, 3), round(e, 3), cur])
            cur, s = "", None
            continue
        if s is None:
            s = cs
        cur += ch
        e = ce
    if cur:
        uit.append([round(s, 3), round(e, 3), cur])
    return uit


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    taken = []
    for b, data in scripts.items():
        taken.append((f"{b}body", " ".join(data["zinnen"])))
        for i, hook in enumerate(data["hooks"], start=1):
            taken.append((f"{b}h{i}", hook))

    def doe(t):
        key, tekst = t
        h, mp3, al = tts(spreektekst(tekst))
        w = woorden(al)
        disp = tekst.split()
        if len(w) != len(disp):
            raise SystemExit(f"{key}: woordtelling klopt niet ({len(w)} vs {len(disp)})")
        for x, d in zip(w, disp):
            x[2] = d  # ondertitel toont de schrijfwijze uit het script
        return key, {"cache": h, "mp3": str(mp3.relative_to(ROOT)), "woorden": w}

    with ThreadPoolExecutor(4) as pool:
        alle = dict(pool.map(doe, taken))
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps(alle, ensure_ascii=False, indent=1))
    print("klaar:", len(alle), "stukken")


if __name__ == "__main__":
    main()

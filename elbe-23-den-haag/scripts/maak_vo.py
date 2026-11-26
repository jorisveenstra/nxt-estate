"""
Maakt de voice-overs met ElevenLabs (stem YgjXqgzBJa9op0K278OW, model eleven_v4 — expliciet, geen fallback).

Body + CTA wordt één keer ingesproken, elke hook apart. Per video: hook + korte pauze + body.
ElevenLabs levert de timing per teken mee; daaruit maakt dit script src/timing.json
(woorden + scènegrenzen, relatief aan het begin van hook resp. body).

Antwoorden worden bewaard in scripts/tts-cache/ zodat dezelfde tekst nooit twee keer credits kost.
Herkomst (model, stem, request-id, character-cost) staat in scripts/vo-provenance.json.

Authenticatie: in de Claude-cloudomgeving injecteert de proxy de xi-api-key voor api.elevenlabs.io.
Lokaal: ELEVENLABS_API_KEY in ~/.elevenlabs. Sleutels komen nooit in deze repo.

Gebruik: python3 scripts/maak_vo.py
"""
import base64
import hashlib
import json
import subprocess
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
PROV = ROOT / "scripts/vo-provenance.json"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
PAUZE = 0.35  # seconden tussen hook en body
FPS = 30

# Uitspraak: wat in beeld staat vs. wat de stem zegt
UITSPRAAK = {"m²": "vierkante meter"}


def spreektekst(t):
    for a, b in UITSPRAAK.items():
        t = t.replace(a, b)
    return t


def headers():
    h = {"Content-Type": "application/json"}
    f = Path.home() / ".elevenlabs"
    if f.exists():
        for regel in f.read_text().splitlines():
            if regel.startswith("ELEVENLABS_API_KEY="):
                h["xi-api-key"] = regel.split("=", 1)[1].strip()
    return h  # zonder lokale sleutel: proxy-geïnjecteerde authenticatie


def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige:
        body["previous_text"] = vorige
    if volgende:
        body["next_text"] = volgende
    h = hashlib.sha1(json.dumps({**body, "voice": VOICE}, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    prov = json.loads(PROV.read_text()) if PROV.exists() else {}
    if not pad.exists():
        if h in prov and prov[h].get("status") == "sent":
            raise SystemExit(f"Onzeker resultaat voor eerdere aanvraag {h}; niet blind herhalen.")
        prov[h] = {"status": "sent", "model_id": MODEL, "voice_id": VOICE, "text": tekst}
        PROV.write_text(json.dumps(prov, ensure_ascii=False, indent=1))
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers=headers(), method="POST")
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                raw = r.read()
                hd = {k.lower(): v for k, v in r.headers.items()}
        except urllib.error.HTTPError as e:
            prov[h] = {**prov[h], "status": "error", "http": e.code, "error": e.read(2000).decode("utf8", "replace"),
                       "request_id": e.headers.get("request-id")}
            PROV.write_text(json.dumps(prov, ensure_ascii=False, indent=1))
            raise SystemExit(f"ElevenLabs TTS fout {e.code}: {prov[h]['error'][:300]}")
        data = json.loads(raw)
        CACHE.mkdir(exist_ok=True)
        pad.write_text(json.dumps(data))
        prov[h] = {**prov[h], "status": "ok", "request_id": hd.get("request-id"),
                   "character_cost": hd.get("character-cost"), "characters": len(tekst),
                   "headers": {k: hd[k] for k in ("request-id", "character-cost", "history-item-id") if k in hd}}
        PROV.write_text(json.dumps(prov, ensure_ascii=False, indent=1))
        print(f"  gegenereerd ({len(tekst)} tekens, cost {hd.get('character-cost')}): {tekst[:50]}…")
    data = json.loads(pad.read_text())
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists():
        mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"], h


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


def schrijfwijze(ws):
    """'vierkante meter' terug naar 'm²' voor de ondertitels."""
    uit = []
    for w in ws:
        if uit and uit[-1][2].lower() == "vierkante" and w[2].lower().startswith("meter"):
            uit[-1] = [uit[-1][0], w[1], "m²" + w[2][5:]]
        else:
            uit.append(w)
    return uit


def duur(pad):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(pad)],
                                capture_output=True, text=True).stdout)


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    timing = {}
    for b, data in scripts.items():
        zinnen = data["zinnen"]
        body_tekst = spreektekst(" ".join(z for _, z in zinnen))
        body_mp3, body_al, body_id = tts(body_tekst, vorige=spreektekst(data["hooks"][0]))
        ws = woorden(body_al)
        # scènegrenzen: tel woorden per zin (spreektekst)
        scenes, i = [], 0
        for sid, z in zinnen:
            n = len(spreektekst(z).split())
            scenes.append({"id": sid, "start": ws[i][0], "end": ws[i + n - 1][1]})
            i += n
        bd = duur(body_mp3)
        out = ROOT / f"public/vo/{b}-body.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(body_mp3), "-ar", "48000", str(out)], check=True)
        timing[b] = {"body": {"duration": bd, "words": schrijfwijze(ws), "scenes": scenes, "tts": body_id}, "hooks": []}
        for h, hook in enumerate(data["hooks"], start=1):
            mp3, al, hid = tts(spreektekst(hook), volgende=body_tekst[:300])
            hd = duur(mp3)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-ar", "48000", str(ROOT / f"public/vo/{b}-hook{h}.wav")], check=True)
            # hooksegment = hook + pauze, afgerond op hele frames
            seg = -(-int((hd + PAUZE) * FPS * 1000) // 1000) / FPS
            timing[b]["hooks"].append({"duration": hd, "segment": round(seg, 4), "words": schrijfwijze(woorden(al)), "tts": hid})
            print(f"{b} hook {h}: {hd:.2f}s")
        print(f"{b} body: {bd:.2f}s")
    (ROOT / "src/timing.json").write_text(json.dumps(timing, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

"""
Voice-overs voor De Twee Gezusters met ElevenLabs Eleven v4 (stem YgjXqgzBJa9op0K278OW, model eleven_v4).

Per body wordt body + CTA één keer gegenereerd, per hook alleen de hook. De video wordt ook zo gerenderd
(hookdeel + bodydeel), dus de audio blijft per deel apart:
  public/vo/b<b>-body.wav, public/vo/b<b>-h<h>.wav
  scripts/woorden-tts.json   timing per woord, relatief aan het begin van elk deel
  scripts/vo-herkomst.json   model_id, voice_id, request-id en character-cost per generatie (geen sleutels)

Cache in scripts/tts-cache/: dezelfde tekst kost nooit twee keer credits. Een generatie die gestart maar
niet afgerond is (.pending), wordt NIET automatisch herhaald: eerst nagaan of er gefactureerd is.

Sleutel: ELEVENLABS_API_KEY in ~/.elevenlabs, of (Claude cloud) een netwerk-secret dat xi-api-key
injecteert voor api.elevenlabs.io.
"""
import base64
import concurrent.futures as cf
import hashlib
import json
import subprocess
import threading
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
LOCK = threading.Lock()


def sleutel():
    p = Path.home() / ".elevenlabs"
    if p.exists():
        for regel in p.read_text().splitlines():
            if regel.startswith("ELEVENLABS_API_KEY="):
                return regel.split("=", 1)[1].strip()
    return None  # netwerk-secret van de cloudomgeving vult de header in


def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige:
        body["previous_text"] = vorige
    if volgende:
        body["next_text"] = volgende
    h = hashlib.sha1(json.dumps({**body, "voice": VOICE}, sort_keys=True).encode()).hexdigest()[:16]
    pad, pending = CACHE / f"{h}.json", CACHE / f"{h}.pending"
    if not pad.exists():
        if pending.exists():
            raise SystemExit(f"Onzekere eerdere generatie voor {h}: controleer ElevenLabs-historie voordat je opnieuw genereert")
        pending.write_text(json.dumps({"text": tekst[:80]}))
        headers = {"Content-Type": "application/json"}
        k = sleutel()
        if k:
            headers["xi-api-key"] = k
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers=headers)
        try:
            r = urllib.request.urlopen(req, timeout=300)
        except urllib.error.HTTPError as err:  # definitieve weigering: niets gegenereerd
            pending.unlink()
            raise SystemExit(f"ElevenLabs weigerde TTS ({err.code}): {err.read(500)!r}")
        with r:
            data = json.loads(r.read())
            meta = {k2.lower(): v for k2, v in r.headers.items() if k2.lower() in ("request-id", "character-cost", "history-item-id", "x-character-count")}
        data["_herkomst"] = {"model_id": MODEL, "voice_id": VOICE, "tekens": len(tekst), **meta}
        pad.write_text(json.dumps(data))
        pending.unlink()
        print(f"  gegenereerd ({len(tekst)} tekens, {meta.get('character-cost')} credits): {tekst[:60]}…", flush=True)
    data = json.loads(pad.read_text())
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists():
        mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"], data["_herkomst"]


def woorden(al):
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
    CACHE.mkdir(exist_ok=True)
    (ROOT / "public/vo").mkdir(parents=True, exist_ok=True)
    taken = []
    for b, data in scripts.items():
        body_tekst = " ".join(z for _, z in data["zinnen"])
        taken.append((f"{b}-body", body_tekst, data["hooks"][0], ""))
        for h, hook in enumerate(data["hooks"], start=1):
            taken.append((f"{b}-h{h}", hook, "", body_tekst[:300]))
    with cf.ThreadPoolExecutor(4) as ex:
        res = dict(zip([t[0] for t in taken], ex.map(lambda t: tts(t[1], t[2], t[3]), taken)))
    alle, herkomst = {}, {}
    for key, (mp3, al, meta) in res.items():
        alle[key] = woorden(al)
        herkomst[key] = meta
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-ar", "48000", "-ac", "2",
                        str(ROOT / f"public/vo/{key}.wav")], check=True)
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps(alle, ensure_ascii=False))
    (ROOT / "scripts/vo-herkomst.json").write_text(json.dumps(herkomst, indent=1))
    print("klaar:", len(res), "delen")


if __name__ == "__main__":
    main()

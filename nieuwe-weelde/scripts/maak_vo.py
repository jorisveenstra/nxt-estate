"""Voice-overs via ElevenLabs (stem Tijs, YgjXqgzBJa9op0K278OW, model eleven_v4 expliciet).

Per body wordt body + CTA één keer ingesproken en per hook alleen de hook. ElevenLabs levert timing per teken mee,
daaruit komt src/timing.json (per woord, per scène). Antwoorden + provenance (model_id, voice_id, request-id) staan in
scripts/tts-cache/ zodat dezelfde tekst nooit twee keer credits kost. Auth loopt via de proxy; er staat geen sleutel in de repo.
"""
import base64
import hashlib
import json
import subprocess
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
PAUZE = 0.45


def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige:
        body["previous_text"] = vorige
    if volgende:
        body["next_text"] = volgende
    h = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    CACHE.mkdir(exist_ok=True)
    if not pad.exists():
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
                                     data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.loads(r.read())
            hdr = {k: v for k, v in r.headers.items() if k.lower() in ("request-id", "x-request-id", "history-item-id")}
        data["_provenance"] = {"model_id": MODEL, "voice_id": VOICE, "request": {k: v for k, v in body.items()}, "headers": hdr}
        pad.write_text(json.dumps(data))
        print("gegenereerd:", tekst[:60])
    data = json.loads(pad.read_text())
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists():
        mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"]


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


def duur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], text=True))


def naar_wav(mp3, uit, pad=0.0):
    af = f"loudnorm=I=-15:TP=-1.5:LRA=9,apad=pad_dur={pad}" if pad else "loudnorm=I=-15:TP=-1.5:LRA=9"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-af", af, "-ar", "48000", "-ac", "2", str(uit)], check=True)


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    (ROOT / "public/vo").mkdir(exist_ok=True)
    timing = {}
    for b, d in scripts.items():
        n = b[1:]
        zinnen = [z["t"] for z in d["zinnen"]] + [d["cta"]["t"]]
        tekst = " ".join(zinnen)
        mp3, al = tts(tekst, vorige=d["hooks"][0]["t"])
        w = woorden(al)
        assert len(w) == len(tekst.split()), (b, len(w), len(tekst.split()))
        scenes, i = [], 0
        ids = [z["id"] for z in d["zinnen"]] + ["cta"]
        for sid, z in zip(ids, zinnen):
            k = len(z.split())
            scenes.append({"id": sid, "w0": i, "w1": i + k})
            i += k
        for j, sc in enumerate(scenes):
            sc["start"] = 0.0 if j == 0 else w[sc["w0"]][0]
        for j, sc in enumerate(scenes):
            sc["end"] = scenes[j + 1]["start"] if j + 1 < len(scenes) else None
        naar_wav(mp3, ROOT / f"public/vo/body{n}.wav")
        bd = duur(ROOT / f"public/vo/body{n}.wav")
        scenes[-1]["end"] = bd
        timing[b] = {"body": {"duur": bd, "words": w, "scenes": scenes}, "hooks": {}}
        print(b, "body", round(bd, 1), "s")
        for h, hk in enumerate(d["hooks"], start=1):
            hm, ha = tts(hk["t"], volgende=tekst[:300])
            naar_wav(hm, ROOT / f"public/vo/hook{n}-{h}.wav", PAUZE)
            hd = duur(ROOT / f"public/vo/hook{n}-{h}.wav")
            timing[b]["hooks"][str(h)] = {"duur": hd, "words": woorden(ha)}
            print(b, "hook", h, round(hd, 1), "s")
    (ROOT / "src/timing.json").write_text(json.dumps(timing, ensure_ascii=False))


if __name__ == "__main__":
    main()

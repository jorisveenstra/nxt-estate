"""
Voice-overs voor Fresch Loods Breda via ElevenLabs TTS met woordtiming.

Stem YgjXqgzBJa9op0K278OW, model_id expliciet "eleven_v4" (geen fallback).
Per body wordt body + CTA één keer gemaakt, per hook alleen de hook.
Authenticatie: de cloudomgeving injecteert de xi-api-key voor api.elevenlabs.io (netwerksecret);
lokaal kan ELEVENLABS_API_KEY (env) gebruikt worden. Sleutels komen nooit in deze repo.

Schrijft:
  scripts/tts-cache/<hash>.json|.mp3   (niet in git; wel in het bronarchief)
  scripts/vo-herkomst.json             model, stem, request-id, history-item-id, kosten per aanvraag
  scripts/woorden-tts.json             woordtiming: "b1" (body, t.o.v. bodystart), "b1h1" (hook)
Gebruik: python3 scripts/maak_vo.py
"""
import base64, hashlib, json, os, sys, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
UITSPRAAK = [("Fresch", "Fresh"), ("m²", "vierkante meter"), ("1.000", "duizend"), ("9 eigen", "negen eigen"),
             ("turn-key", "turnkey")]


def spreektekst(t):
    for a, b in UITSPRAAK:
        t = t.replace(a, b)
    return t


def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige:
        body["previous_text"] = vorige
    if volgende:
        body["next_text"] = volgende
    h = hashlib.sha1(json.dumps({**body, "voice": VOICE}, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    meta_pad = CACHE / f"{h}.meta.json"
    if not pad.exists():
        if meta_pad.exists():
            sys.exit(f"{h}: eerdere aanvraag met onzekere afloop; niet blind herhalen")
        meta_pad.write_text(json.dumps({"status": "verzonden", "model_id": MODEL, "voice_id": VOICE, "text": tekst}))
        headers = {"Content-Type": "application/json"}
        if os.environ.get("ELEVENLABS_API_KEY"):
            headers["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                data = json.loads(r.read())
                hdr = {k.lower(): v for k, v in r.headers.items()}
        except urllib.error.HTTPError as e:
            meta_pad.unlink()  # definitief geweigerd: geen audio, geen onzekerheid
            sys.exit(f"ElevenLabs weigerde ({e.code}): {e.read(400).decode(errors='replace')}")
        pad.write_text(json.dumps(data))
        meta_pad.write_text(json.dumps({
            "status": "klaar", "model_id": MODEL, "voice_id": VOICE, "text": tekst,
            "request_id": hdr.get("request-id"), "history_item_id": hdr.get("history-item-id"),
            "character_cost": hdr.get("character-cost"), "characters": len(tekst)}))
        print(f"  gegenereerd ({len(tekst)} tekens): {tekst[:60]}", flush=True)
    data = json.loads(pad.read_text())
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists():
        mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return h, data["alignment"]


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
    CACHE.mkdir(parents=True, exist_ok=True)
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    taken = {}
    for b, d in scripts.items():
        body_tekst = spreektekst(" ".join(z for _, z in d["zinnen"]))
        taken[b] = (body_tekst, spreektekst(d["hooks"][0]), "")
        for i, hook in enumerate(d["hooks"], 1):
            taken[f"{b}h{i}"] = (spreektekst(hook), "", body_tekst[:300])
    with ThreadPoolExecutor(4) as pool:
        res = dict(zip(taken, pool.map(lambda a: tts(*a), taken.values())))
    alle, herkomst = {}, {}
    for key, (h, al) in res.items():
        alle[key] = woorden(al)
        meta = json.loads((CACHE / f"{h}.meta.json").read_text()) if (CACHE / f"{h}.meta.json").exists() else {}
        herkomst[key] = {"cache": h, **{k: v for k, v in meta.items() if k != "status"}}
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps(alle, ensure_ascii=False))
    (ROOT / "scripts/vo-herkomst.json").write_text(json.dumps(herkomst, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

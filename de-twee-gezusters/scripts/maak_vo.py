"""Voice-overs via ElevenLabs (model eleven_v4, expliciet). Body+CTA één keer per body, per hook alleen de hook.
Schrijft scripts/vo/<key>.json (alignment, request-id, character-cost, voice_id, model_id) en .mp3.
Authenticatie loopt via de cloudomgeving (netwerksecret); geen sleutel in de repo."""
import base64, json, sys, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "scripts/vo"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
UITSPRAAK = {"A+++": "A plus plus plus", "VvE": "V V E", "VVE": "V V E"}


def spreek(t):
    for a, b in UITSPRAAK.items():
        t = t.replace(a, b)
    return t


def tts(key, tekst, vorige="", volgende=""):
    pad = OUT / f"{key}.json"
    if pad.exists():
        return key
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige: body["previous_text"] = vorige
    if volgende: body["next_text"] = volgende
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
        json.dumps(body).encode(), {"Content-Type": "application/json", "xi-api-key": "proxy"})
    try:
        r = urllib.request.urlopen(req, timeout=300)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"ELEVENLABS_FOUT {key} {e.code} {e.read()[:300]}")
    h = {k.lower(): v for k, v in r.headers.items()}
    data = json.load(r)
    (OUT / f"{key}.mp3").write_bytes(base64.b64decode(data["audio_base64"]))
    pad.write_text(json.dumps({"key": key, "text": tekst, "voice_id": VOICE, "model_id": MODEL, "request_id": h.get("request-id"),
                               "character_cost": h.get("character-cost"), "alignment": data["alignment"]}, ensure_ascii=False))
    print("ok", key, h.get("request-id"), h.get("character-cost"), flush=True)
    return key


def main():
    OUT.mkdir(exist_ok=True)
    sc = json.loads((ROOT / "scripts/scripts.json").read_text())
    jobs = []
    for b, d in sc.items():
        body = spreek(" ".join(d["body"] + d["cta"]))
        jobs.append((f"b{b}", body, spreek(d["hooks"][0]), ""))
        for h, hook in enumerate(d["hooks"], 1):
            jobs.append((f"b{b}h{h}", spreek(hook), "", body[:250]))
    # eerst één verzoek om voice/model te valideren
    tts(*jobs[0])
    with ThreadPoolExecutor(4) as ex:
        list(ex.map(lambda j: tts(*j), jobs[1:]))


if __name__ == "__main__":
    main()

"""Maakt de body-voice-overs (inclusief CTA) opnieuw met ElevenLabs eleven_v4 + tijdstempels.
Hook-voice-overs blijven ongewijzigd (provenance: eleven_v4, zie provenance/voiceover.json).
Authenticatie: de ElevenLabs-netwerksecret van de cloudomgeving (geen sleutel in deze repo).
Gebruik: python3 scripts/maak_vo.py b1 [b2 b3]  ->  public/vo/<b>-body.mp3, scripts/vo-cache/<b>-body.json"""
import json, sys, base64, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
SP = json.loads((ROOT / "scripts/scripts.json").read_text())
PROV = ROOT / "provenance/voiceover.json"
VOICE, MODEL = "YgjXqgzBJa9op0K278OW", "eleven_v4"
def spreek(t): return t.replace("Karakterplein 15", "Karakterplein vijftien").replace("225", "tweehonderdvijfentwintig")
def maak(k, on_headers=None):
    tekst = spreek(" ".join(SP[k]["body"] + [SP[k]["cta"]]))
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
                                 json.dumps({"text": tekst, "model_id": MODEL}).encode(), {"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=300) as r:
        headers = dict(r.headers.items()); data = json.load(r)
    rid = headers.get("request-id") or headers.get("Request-Id")
    (ROOT / f"public/vo/{k}-body.mp3").write_bytes(base64.b64decode(data["audio_base64"]))
    (ROOT / f"scripts/vo-cache/{k}-body.json").write_text(json.dumps({"alignment": data["alignment"]}))
    prov = json.loads(PROV.read_text())
    prov["items"][f"{k}-body"] = {"voice_id": VOICE, "model_id": MODEL, "request_id": rid,
                                  "character_cost": headers.get("character-cost"), "chars": len(tekst), "revision": "225 m2 + kijkafspraak"}
    PROV.write_text(json.dumps(prov, indent=1))
    if on_headers: on_headers(k, rid, headers, len(tekst))
    return rid
if __name__ == "__main__":
    for k in sys.argv[1:]: print(k, maak(k))

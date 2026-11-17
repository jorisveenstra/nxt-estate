"""Voice-overs via ElevenLabs, stem YgjXqgzBJa9op0K278OW, model eleven_v4 (verplicht, geen fallback).

Per body één opname (body + CTA), per hook een losse opname. Alignment per teken wordt bewaard in
public/vo/*.json; provenance (model, stem, request-id) in bronnen/generaties.json.
"""
import base64, hashlib, json, subprocess
from concurrent.futures import ThreadPoolExecutor
from el import Ledger, paid, report, ROOT

VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
UITSPRAAK = {"293 m²": "tweehonderddrieënnegentig vierkante meter", "A+++": "A plus plus plus",
             "N200": "N tweehonderd", "STOCK": "Stock", "turn-key": "turnkey"}


def spreek(t):
    for a, b in UITSPRAAK.items():
        t = t.replace(a, b)
    return t


def tts(naam, tekst, vorige="", volgende=""):
    led = Ledger()
    mp3, js = ROOT / f"public/vo/{naam}.mp3", ROOT / f"public/vo/{naam}.json"
    body = {"text": spreek(tekst), "model_id": MODEL, "language_code": "nl"}
    if vorige: body["previous_text"] = spreek(vorige)
    if volgende: body["next_text"] = spreek(volgende)
    key = "tts:" + naam + ":" + hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    if mp3.exists() and js.exists() and (led.get(key) or {}).get("status") == "done":
        return
    content, hdr = paid(led, key, "POST", f"/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_192",
                        body=body, meta={"model_id": MODEL, "voice_id": VOICE, "text": body["text"]})
    if content is None:
        raise RuntimeError(f"{naam}: opname gemeld als klaar maar bestand ontbreekt")
    data = json.loads(content)
    mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    js.write_text(json.dumps({"tekst": tekst, "alignment": data["alignment"]}, ensure_ascii=False))
    rid = hdr.get("request-id")
    led.update(key, lambda v: {**v, "status": "done", "request_id": rid, "character_cost": hdr.get("character-cost"),
                                "file": mp3.name, "sha256": hashlib.sha256(mp3.read_bytes()).hexdigest()})
    report("voiceover", MODEL, rid, hdr, characters=len(body["text"]))
    print(naam, "ok")


def main():
    s = json.loads((ROOT / "scripts/scripts.json").read_text())
    jobs = []
    for b, d in s.items():
        body = " ".join(d["zinnen"] + [d["cta"]])
        jobs.append((f"body{b}", body, d["hooks"][0], ""))
        for h, hook in enumerate(d["hooks"], 1):
            jobs.append((f"b{b}h{h}", hook, "", body[:300]))
    with ThreadPoolExecutor(4) as ex:
        list(ex.map(lambda j: tts(*j), jobs))


if __name__ == "__main__":
    main()

"""Voice-overs met ElevenLabs Eleven v4 (model_id expliciet), stem YgjXqgzBJa9op0K278OW, met woordtiming.
Per hook een losse opname (b<B>_h<H>) en per body één opname van body + CTA (b<B>_body).
Uitvoer: public/vo/<naam>.mp3 + generatie/vo/<naam>.json (alignment, tekst, model, voice, request-id).
"""
import json, re, base64, pathlib
from el import request, ledger_get, ledger_update, ROOT

VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
SEG = re.compile(r"\{([^|}]+)\|([^}]+)\}")

def spoken(t): return SEG.sub(lambda m: m.group(2), t)

def jobs():
    s = json.loads((ROOT / "scripts/scripts.json").read_text())["bodies"]
    out = {}
    for b, d in s.items():
        for i, h in enumerate(d["hooks"], 1):
            out[f"b{b}_h{i}"] = [h]
        out[f"b{b}_body"] = d["body"] + d["cta"]
    return out

def make(name, sentences, on_usage=None):
    mp3 = ROOT / "public/vo" / f"{name}.mp3"
    meta = ROOT / "generatie/vo" / f"{name}.json"
    rec = ledger_get("vo:" + name) or {}
    if rec.get("status") == "klaar" and mp3.exists() and meta.exists():
        return
    if rec.get("status") == "verzonden":
        raise RuntimeError(f"{name}: eerdere TTS-aanroep onzeker; niet blind herhalen")
    text = " ".join(spoken(x) for x in sentences)
    body = {"text": text, "model_id": MODEL, "language_code": "nl",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}}
    ledger_update("vo:" + name, status="verzonden", model=MODEL, voice=VOICE)
    st, h, raw = request("POST", f"/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_192", body)
    if st >= 300:
        ledger_update("vo:" + name, status="afgewezen", error=f"{st}: {raw[:300].decode(errors='ignore')}")
        raise RuntimeError(f"{name}: TTS {st}: {raw[:400]!r}")
    hl = {k.lower(): v for k, v in h.items()}
    j = json.loads(raw)
    mp3.write_bytes(base64.b64decode(j["audio_base64"]))
    meta.parent.mkdir(exist_ok=True)
    meta.write_text(json.dumps({"name": name, "model_id": MODEL, "voice_id": VOICE, "request_id": hl.get("request-id"),
                                "history_item_id": hl.get("history-item-id"), "character_cost": hl.get("character-cost"),
                                "sentences": sentences, "text": text, "alignment": j["alignment"]}, ensure_ascii=False))
    ledger_update("vo:" + name, status="klaar", request_id=hl.get("request-id"), character_cost=hl.get("character-cost"))
    if on_usage:
        on_usage("voiceover", MODEL, hl.get("request-id"), h, len(text))

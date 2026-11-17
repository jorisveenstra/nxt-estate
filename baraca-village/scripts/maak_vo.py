"""
Voice-overs via ElevenLabs: stem YgjXqgzBJa9op0K278OW (Tijs), model eleven_v4 (verplicht, geen fallback).

Per body wordt body + CTA één keer ingesproken, per hook alleen de hook. Het endpoint
/with-timestamps levert de timing per teken; daaruit maakt dit script scripts/woorden-tts.json.
Antwoorden staan in scripts/tts-cache/ zodat dezelfde tekst nooit twee keer credits kost.

Gebruik: python3 scripts/maak_vo.py
"""
import base64
import hashlib
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from el import ROOT, bon, request  # noqa: E402

CACHE = ROOT / "scripts/tts-cache"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"

# Wat in beeld staat -> wat de stem zegt
UITSPRAAK = [
    ("165.000", "honderdvijfenzestigduizend"),
    ("7,5", "zeven komma vijf"),
    ("2,5", "twee komma vijf"),
    ("2028", "tweeduizend achtentwintig"),
    ("12 procent", "twaalf procent"),
    ("10 procent", "tien procent"),
    ("PT PMA", "pee-tee pee-em-aa"),
    ("HGB-titel", "haa-gee-bee-titel"),
]


def spreektekst(t):
    for a, b in UITSPRAAK:
        t = t.replace(a, b)
    return t


def tts(naam, tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}}
    if vorige:
        body["previous_text"] = vorige
    if volgende:
        body["next_text"] = volgende
    h = hashlib.sha1(json.dumps({**body, "voice": VOICE}, sort_keys=True).encode()).hexdigest()[:16]
    pad = CACHE / f"{h}.json"
    if not pad.exists():
        lock = CACHE / f"{h}.pending"
        if lock.exists():
            raise SystemExit(f"{naam}: eerdere aanvraag had een onzekere uitkomst; controleer handmatig (geen blinde herhaling)")
        lock.write_text(naam)
        status, headers, raw = request("POST", f"/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_192", body)
        bon(f"tts-{naam}-{h}", "voiceover", MODEL, headers, status=status, characters=len(tekst), voice_id=VOICE)
        if status != 200:
            raise SystemExit(f"{naam}: ElevenLabs TTS fout {status}: {raw[:300]!r}")
        data = json.loads(raw)
        data["_provenance"] = {"model_id": MODEL, "voice_id": VOICE, "request_id": headers.get("request-id"),
                               "history_item_id": headers.get("history-item-id"), "text": tekst}
        pad.write_text(json.dumps(data))
        lock.unlink()
        print(f"  gegenereerd {naam} ({len(tekst)} tekens)", flush=True)
    data = json.loads(pad.read_text())
    assert data["_provenance"]["model_id"] == MODEL
    mp3 = ROOT / f"public/vo/{naam}.mp3"
    mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return naam, data["alignment"], data["_provenance"]


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
    CACHE.mkdir(parents=True, exist_ok=True)
    (ROOT / "public/vo").mkdir(parents=True, exist_ok=True)
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    taken = []
    for b, data in scripts.items():
        body_tekst = spreektekst(" ".join(z for _, z in data["zinnen"]))
        taken.append((f"{b}_body", body_tekst, spreektekst(data["hooks"][0]), ""))
        for h, hook in enumerate(data["hooks"], start=1):
            taken.append((f"{b}_h{h}", spreektekst(hook), "", body_tekst[:300]))
    with ThreadPoolExecutor(4) as pool:
        res = list(pool.map(lambda t: tts(*t), taken))
    alle = {naam: woorden(al) for naam, al, _ in res}
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps(alle, ensure_ascii=False))
    (ROOT / "scripts/vo-provenance.json").write_text(json.dumps({naam: p for naam, _, p in res}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

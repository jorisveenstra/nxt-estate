"""
Voice-overs via ElevenLabs Eleven v4 (stem YgjXqgzBJa9op0K278OW, model_id expliciet "eleven_v4").

Per body wordt body + CTA één keer gegenereerd en per hook alleen de hook. Elke hook wordt
opgevuld tot een hele frame-grens (HOOK_FRAMES in scripts/vo-meta.json), zodat het
hook-videosegment en het body-videosegment later met ffmpeg -c copy aan elkaar kunnen.

- Antwoorden staan in scripts/tts-cache/<hash>.json (+ .mp3) -> dezelfde tekst kost nooit opnieuw credits.
- Vóór elke POST wordt een .pending-marker geschreven; een marker zonder resultaat = onzekere uitkomst,
  dan wordt NIET automatisch opnieuw betaald (handmatig controleren).
- Provenance (model_id, voice_id, request-id, character-cost) -> scripts/vo-provenance.json.
- Authenticatie: de cloud-proxy injecteert xi-api-key voor api.elevenlabs.io; lokaal kan
  ELEVENLABS_API_KEY in de omgeving staan. Er wordt nooit een sleutel weggeschreven.
- Optioneel: NXT_BRIDGE_DIR wijst naar een map met b.py (portal-bridge) om verbruik te melden.

Gebruik: python3 scripts/maak_vo.py
"""
import base64, hashlib, json, math, os, subprocess, sys, threading, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
FPS = 30
PAUZE = 0.35
UITSPRAAK = {"RMW Makelaars": "R M W Makelaars"}
LOCK = threading.Lock()

bridge = None
if os.environ.get("NXT_BRIDGE_DIR"):
    sys.path.insert(0, os.environ["NXT_BRIDGE_DIR"])
    import b as _b
    bridge = _b.bridge()


def spreek(t):
    for a, c in UITSPRAAK.items():
        t = t.replace(a, c)
    return t


def headers():
    h = {"Content-Type": "application/json", "User-Agent": "video-ads/1.0"}
    if os.environ.get("ELEVENLABS_API_KEY"):
        h["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
    return h


def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl"}
    if vorige:
        body["previous_text"] = vorige
    if volgende:
        body["next_text"] = volgende
    h = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    pad, pending = CACHE / f"{h}.json", CACHE / f"{h}.pending"
    if not pad.exists():
        if pending.exists():
            raise SystemExit(f"Onzekere eerdere TTS-aanvraag {h}; niet blind herhalen")
        pending.write_text(json.dumps({"text": tekst[:80]}))
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), headers=headers(), method="POST")
        with urllib.request.urlopen(req, timeout=300) as r:
            raw = {k.lower(): v for k, v in r.headers.items()}
            data = json.loads(r.read())
        rid = raw.get("request-id")
        meta = {"model_id": MODEL, "voice_id": VOICE, "request_id": rid,
                "character_cost": raw.get("character-cost"), "characters": len(tekst), "text": tekst}
        data["_provenance"] = meta
        pad.write_text(json.dumps(data))
        pending.unlink()
        print(f"  gegenereerd {h} ({len(tekst)} tekens, cost {meta['character_cost']}): {tekst[:50]}", flush=True)
        if bridge and rid:
            with LOCK:
                print("   usage:", bridge.record_elevenlabs("voiceover", MODEL, rid, headers=raw, characters=len(tekst)), flush=True)
    data = json.loads(pad.read_text())
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists():
        mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"], data["_provenance"]


def woorden(al, offset):
    uit, cur, s, e = [], "", None, None
    for ch, cs, ce in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                uit.append([round(s + offset, 3), round(e + offset, 3), cur])
            cur, s = "", None
            continue
        if s is None:
            s = cs
        cur += ch
        e = ce
    if cur:
        uit.append([round(s + offset, 3), round(e + offset, 3), cur])
    return uit


def duur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                                capture_output=True, text=True).stdout)


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    CACHE.mkdir(parents=True, exist_ok=True)
    (ROOT / "public/vo").mkdir(parents=True, exist_ok=True)
    jobs = []
    for b, d in scripts.items():
        body_tekst = spreek(" ".join(d["zinnen"] + [d["cta"]]))
        jobs.append(("body", b, 0, body_tekst, spreek(d["hooks"][0]), ""))
        for i, hook in enumerate(d["hooks"], 1):
            jobs.append(("hook", b, i, spreek(hook), "", body_tekst[:300]))
    with ThreadPoolExecutor(4) as ex:
        res = list(ex.map(lambda j: (j, tts(j[3], j[4], j[5])), jobs))
    woord, meta, prov = {}, {}, []
    bodies = {j[1]: r for j, r in res if j[0] == "body"}
    for j, (mp3, al, pv) in res:
        prov.append({"part": f"b{j[1]}" + (f"h{j[2]}" if j[0] == "hook" else "body"), **pv, "file": mp3.name})
        if j[0] == "body":
            b = j[1]
            uit = ROOT / f"public/vo/b{b}-body.wav"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-ar", "48000", "-ac", "1", str(uit)], check=True)
            meta[f"b{b}"] = {"bodyDur": duur(uit)}
            woord[f"b{b}"] = woorden(al, 0)
    for j, (mp3, al, pv) in res:
        if j[0] != "hook":
            continue
        b, h = j[1], j[2]
        hd = duur(mp3)
        frames = math.ceil((hd + PAUZE) * FPS)
        uit = ROOT / f"public/vo/b{b}h{h}-hook.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-af", f"apad=whole_dur={frames / FPS}",
                        "-t", f"{frames / FPS}", "-ar", "48000", "-ac", "1", str(uit)], check=True)
        meta[f"b{b}h{h}"] = {"hookFrames": frames, "hookDur": hd}
        woord[f"b{b}h{h}"] = woorden(al, 0)
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps(woord, ensure_ascii=False))
    (ROOT / "scripts/vo-meta.json").write_text(json.dumps(meta, indent=1))
    (ROOT / "scripts/vo-provenance.json").write_text(json.dumps(prov, ensure_ascii=False, indent=1))
    for k, v in meta.items():
        print(k, v)


if __name__ == "__main__":
    main()

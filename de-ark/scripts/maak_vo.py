"""
Maakt de voice-overs met ElevenLabs (stem YgjXqgzBJa9op0K278OW, model eleven_v4).

Per body wordt de body + CTA één keer gegenereerd en per hook alleen de hook; daarna wordt per video
hook + korte pauze + body aan elkaar geplakt. De timing per teken wordt per woord opgeslagen in
scripts/woorden-tts.json (voor scripts/lijn_uit.py).

Authenticatie: de omgeving injecteert xi-api-key voor api.elevenlabs.io (netwerkgeheim); er staat geen sleutel in de repo.
Antwoorden + request-id/character-cost staan in scripts/tts-cache/ en worden aan de portal gerapporteerd (record_elevenlabs).

Gebruik: python3 scripts/maak_vo.py <portal-payload.json> <runid.txt>
"""
import base64, hashlib, json, os, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT.parent))
CACHE = ROOT / "scripts/tts-cache"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
PAUZE = 0.35

UITSPRAAK = {"A+++-nieuwbouw": "A plus plus plus nieuwbouw", "A+++": "A plus plus plus", "HR++": "HR plus plus", "BeBo": "Bebo"}
bridge = None


def spreektekst(t):
    for a, b in UITSPRAAK.items():
        t = t.replace(a, b)
    return t


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
        hdr = CACHE / f"{h}.hdr"
        r = subprocess.run(["curl", "-sS", "-m", "300", "-D", str(hdr), "-X", "POST",
                            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
                            "-H", "Content-Type: application/json", "-d", json.dumps(body)], capture_output=True, text=True)
        heads = {}
        for line in hdr.read_text().splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                heads[k.strip().lower()] = v.strip()
        try:
            data = json.loads(r.stdout)
        except Exception:
            raise SystemExit(f"TTS mislukt: {r.stdout[:200]}")
        if "audio_base64" not in data:
            raise SystemExit(f"TTS fout: {json.dumps(data)[:300]}")
        data["_meta"] = {"model_id": MODEL, "voice_id": VOICE, "request_id": heads.get("request-id"),
                         "character_cost": heads.get("character-cost"), "chars": len(tekst), "headers": {k: v for k, v in heads.items() if k in ("request-id", "character-cost")}}
        pad.write_text(json.dumps(data))
        hdr.unlink()
        print(f"  gegenereerd ({len(tekst)} tekens): {tekst[:60]}…", flush=True)
    data = json.loads(pad.read_text())
    m = data["_meta"]
    if bridge and m.get("request_id"):
        bridge.record_elevenlabs("voiceover", MODEL, m["request_id"], headers=m["headers"], characters=m["chars"])
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists():
        mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"]


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


def duur(pad):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(pad)], capture_output=True, text=True).stdout)


def main():
    global bridge
    if len(sys.argv) > 2:
        os.chdir(ROOT / "scripts")
        from portal_bridge import PortalBridge
        p = json.load(open(sys.argv[1]))
        bridge = PortalBridge(p["jobUrl"], p["jobToken"], ["https://portal.nxt-estate.com"])
        bridge.run_id = open(sys.argv[2]).read().strip()
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    alle = {}
    (ROOT / "public/vo").mkdir(exist_ok=True)
    for b, data in scripts.items():
        body_tekst = spreektekst(" ".join(data["zinnen"] + [data["cta"]]))
        body_mp3, body_al = tts(body_tekst, vorige=spreektekst(data["hooks"][0]))
        for h, hook in enumerate(data["hooks"], start=1):
            key = f"b{b}h{h}"
            hook_mp3, hook_al = tts(spreektekst(hook), volgende=body_tekst[:300])
            hd = duur(hook_mp3)
            alle[key] = woorden(hook_al, 0) + woorden(body_al, hd + PAUZE)
            uit = ROOT / f"public/vo/{key}.wav"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(hook_mp3), "-i", str(body_mp3), "-filter_complex",
                            f"[0]apad=pad_dur={PAUZE}[a];[a][1]concat=n=2:v=0:a=1,loudnorm=I=-14:TP=-1:LRA=9", "-ar", "48000", str(uit)], check=True)
            print(f"{key}: hook {hd:.1f}s + body {duur(body_mp3):.1f}s -> {duur(uit):.1f}s", flush=True)
    (ROOT / "scripts/woorden-tts.json").write_text(json.dumps(alle, ensure_ascii=False))
    if bridge:
        bridge.flush_usage()


if __name__ == "__main__":
    main()

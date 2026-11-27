"""
Voice-overs voor Haarlem Business Center met ElevenLabs Eleven v4 (model_id="eleven_v4", stem Tijs
YgjXqgzBJa9op0K278OW, de vaste stem van deze repo). Per body wordt body + CTA één keer gegenereerd en per
hook alleen de hook; per video: hook + korte pauze + body.

Authenticatie: in de Claude-cloudomgeving voegt een netwerkgeheim de xi-api-key toe voor api.elevenlabs.io.
Lokaal: zet ELEVENLABS_API_KEY in de omgeving. Er staat nooit een sleutel in deze repo.

Elke aanvraag wordt bewaard in scripts/tts-cache/<hash>.json (audio + timing) met <hash>.meta.json
(model_id, voice_id, request-id, character-cost), zodat dezelfde tekst nooit twee keer credits kost.

Schrijft: public/vo/b<B>h<H>.wav, public/vo/b<B>-body.wav, public/vo/b<B>h<H>-hook.wav en src/timing.json
Gebruik: python3 scripts/maak_vo.py
"""
import base64, hashlib, json, os, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"
VOICE = "YgjXqgzBJa9op0K278OW"
MODEL = "eleven_v4"
PAUZE = 0.35  # s tussen hook en body
LEAD = 0.15   # s stilte voor de hook

# Uitspraak per woord (beeld toont de schrijfwijze, de stem zegt dit)
UITSPRAAK = {"1.895": "achttienhonderdvijfennegentig", "148": "honderdachtenveertig", "120": "honderdtwintig",
             "2026,": "tweeduizend zesentwintig,", "2026": "tweeduizend zesentwintig", "HR++-glas.": "HR-plus-plus-glas.",
             "IT-": "IT-"}


def spreek(tokens):
    """Spreektekst + per scriptwoord [begin, eind) in die tekst."""
    out, spans = "", []
    for t in tokens:
        if out:
            out += " "
        s = UITSPRAAK.get(t, t)
        spans.append((len(out), len(out) + len(s)))
        out += s
    return out, spans


def tts(tekst, vorige="", volgende=""):
    body = {"text": tekst, "model_id": MODEL, "language_code": "nl",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}}
    if vorige: body["previous_text"] = vorige
    if volgende: body["next_text"] = volgende
    h = hashlib.sha1(json.dumps({**body, "voice": VOICE}, sort_keys=True).encode()).hexdigest()[:16]
    pad, meta = CACHE / f"{h}.json", CACHE / f"{h}.meta.json"
    if not pad.exists():
        if meta.exists():
            raise SystemExit(f"Onzekere eerdere aanvraag {h}: niet blind herhalen")
        CACHE.mkdir(exist_ok=True)
        meta.write_text(json.dumps({"state": "requesting", "model_id": MODEL, "voice_id": VOICE, "text": tekst}))
        cmd = ["curl", "-sS", "-D", str(pad) + ".hdr", "-o", str(pad) + ".part", "-w", "%{http_code}", "-X", "POST",
               f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
               "-H", "Content-Type: application/json", "--data-binary", json.dumps(body)]
        if os.environ.get("ELEVENLABS_API_KEY"):
            cmd += ["-H", "xi-api-key: " + os.environ["ELEVENLABS_API_KEY"]]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        hdr = {}
        for line in Path(str(pad) + ".hdr").read_text(errors="ignore").splitlines():
            if ":" in line:
                k, v = line.split(":", 1); hdr[k.strip().lower()] = v.strip()
        info = {"state": "done" if r.stdout == "200" else "error", "http": r.stdout, "model_id": MODEL, "voice_id": VOICE,
                "text": tekst, "request_id": hdr.get("request-id"), "character_cost": hdr.get("character-cost"),
                "headers": {k: v for k, v in hdr.items() if k in ("request-id", "character-cost", "history-item-id", "x-character-count", "tts-latency-ms", "content-type")}}
        meta.write_text(json.dumps(info, indent=1))
        if r.stdout != "200":
            raise SystemExit(f"ElevenLabs TTS fout {r.stdout}: {Path(str(pad) + '.part').read_text()[:400]}")
        Path(str(pad) + ".part").rename(pad)
        print(f"  gegenereerd ({len(tekst)} tekens, cost {info['character_cost']}): {tekst[:60]}…")
    data = json.loads(pad.read_text())
    mp3 = CACHE / f"{h}.mp3"
    if not mp3.exists():
        mp3.write_bytes(base64.b64decode(data["audio_base64"]))
    return mp3, data["alignment"]


def woordtijden(al, spans, offset):
    cs, ce = al["character_start_times_seconds"], al["character_end_times_seconds"]
    return [[round(cs[a] + offset, 3), round(ce[b - 1] + offset, 3)] for a, b in spans]


def duur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                                capture_output=True, text=True).stdout)


def main():
    scripts = json.loads((ROOT / "scripts/scripts.json").read_text())
    (ROOT / "public/vo").mkdir(parents=True, exist_ok=True)
    timing = {}
    for b, data in scripts.items():
        btok = [(sid, w) for sid, z in data["zinnen"] for w in z.split()]
        btxt, bspans = spreek([w for _, w in btok])
        bmp3, bal = tts(btxt, vorige=data["hooks"][0])
        bdur = duur(bmp3)
        bw = woordtijden(bal, bspans, 0)
        body_scenes = []
        for sid, _ in data["zinnen"]:
            idx = [k for k, (s, _) in enumerate(btok) if s == sid]
            body_scenes.append({"id": sid, "start": bw[idx[0]][0], "words": [{"t": btok[k][1], "s": bw[k][0], "e": bw[k][1]} for k in idx]})
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(bmp3), "-af", "apad=pad_dur=2.5", "-ar", "48000", "-ac", "2",
                        str(ROOT / f"public/vo/{b}-body.wav")], check=True)
        timing[b] = {"body": {"dur": bdur, "end": bw[-1][1], "scenes": body_scenes}, "hooks": {}}
        for h, hook in enumerate(data["hooks"], start=1):
            htok = hook.split()
            htxt, hspans = spreek(htok)
            hmp3, hal = tts(htxt, volgende=btxt[:300])
            hw = woordtijden(hal, hspans, LEAD)
            hd = LEAD + duur(hmp3)
            timing[b]["hooks"][str(h)] = {"dur": round(hd + PAUZE, 3), "words": [{"t": t, "s": s, "e": e} for t, (s, e) in zip(htok, hw)]}
            subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(hmp3), "-af", f"adelay={int(LEAD*1000)}:all=1,apad=pad_dur={PAUZE}",
                            "-ar", "48000", "-ac", "2", str(ROOT / f"public/vo/{b}h{h}-hook.wav")], check=True)
            print(f"{b}h{h}: hook {hd:.2f}s + body {bdur:.2f}s")
    (ROOT / "src/timing.json").write_text(json.dumps(timing, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

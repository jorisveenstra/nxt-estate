"""
Maakt per video de voice-over (hook + body + CTA) met ElevenLabs TTS (met woordtiming) en schrijft
public/vo/b<body>h<hook>.wav en src/timing.json. Beeldtekst = scripttekst; uitspraak via SPREEK.
Gebruik: python3 scripts/maak_vo.py   (hergebruikt scripts/tts-cache/ om niet dubbel te betalen)
"""
import base64, json, os, subprocess, hashlib, re
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/tts-cache"; CACHE.mkdir(exist_ok=True)
VOICE = "jfwdd64Nlhnj6vcFqRHZ"  # Koen - Professional, Clear and Friendly (NL)
MODEL = "eleven_multilingual_v2"
HDR = {"xi-api-key": os.environ["ELEVENLABS_API_KEY"]} if os.environ.get("ELEVENLABS_API_KEY") else {}
PAUZE_ZIN = 0.3   # extra stilte na elke zin (scène)
PAUZE_HOOK = 0.45
SPREEK = {"m²,": "vierkante meter,", "24/7": "vierentwintig zeven", "A++,": "A plus plus,", "A++": "A plus plus", "HR++": "H R plus plus",
          "A9": "A negen", "A10,": "A tien,", "A10": "A tien", "2026.": "tweeduizend zesentwintig."}

def spoken(w): return SPREEK.get(w, w)

def tts(zinnen):
    """zinnen: lijst teksten. Eén TTS-call, geeft per zin (start, eind) en per woord (tekst, start, eind)."""
    woorden = [w for z in zinnen for w in z.split()]
    sp = []; 
    for z in zinnen: sp.append(" ".join(spoken(w) for w in z.split()))
    full = " ".join(sp)
    key = hashlib.sha256((VOICE + MODEL + full).encode()).hexdigest()[:16]
    mp3, js = CACHE / f"{key}.mp3", CACHE / f"{key}.json"
    if not js.exists():
        r = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128", headers=HDR, timeout=300,
                          json={"text": full, "model_id": MODEL, "language_code": "nl", "voice_settings": {"stability": 0.55, "similarity_boost": 0.8, "style": 0.15, "speed": 1.0}})
        r.raise_for_status(); d = r.json()
        mp3.write_bytes(base64.b64decode(d["audio_base64"])); js.write_text(json.dumps(d["alignment"]))
    al = json.loads(js.read_text())
    st, en = al["character_start_times_seconds"], al["character_end_times_seconds"]
    res_w, pos = [], 0
    for z in sp:
        zs = []
        for sw in z.split(" "):
            a = full.index(sw, pos); b = a + len(sw); pos = b
            zs.append((st[a], en[b - 1]))
        res_w.append(zs)
    # koppel aan beeldwoorden (zelfde aantal tokens, behalve vervangingen met spatie)
    out, k = [], 0
    for z, zs in zip(zinnen, res_w):
        items, j = [], 0
        for w in z.split():
            n = len(spoken(w).split(" "))
            items.append([w, zs[j][0], zs[j + n - 1][1]]); j += n
        out.append(items)
    return mp3, out

def dur(p): return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)

def main():
    S = json.loads((ROOT / "scripts/scripts.json").read_text())
    timing = {}
    for b, d in S.items():
        bn = b[1:]
        zin = [z[1] for z in d["zinnen"]] + [d["cta"]]
        ids = [z[0] for z in d["zinnen"]] + ["cta"]
        bmp3, bw = tts(zin)
        bdur = dur(bmp3)
        for h, htxt in d["hooks"].items():
            hmp3, hw = tts([htxt])
            hd = dur(hmp3)
            off = hd + PAUZE_HOOK
            # body-scènes: schuif per zin extra pauze (zin n krijgt n*PAUZE_ZIN erbij) via atrim/concat
            pieces, t_out, scenes = [], off, []
            sc = [{"id": "hook", "start": hw[0][0][1], "end": hw[0][-1][2], "words": [{"t": w[0], "s": round(w[1], 3), "e": round(w[2], 3)} for w in hw[0]]}]
            filt = f"[0]apad=pad_dur={PAUZE_HOOK}[h];"
            segs = ["[h]"]
            for i, (sid, ws) in enumerate(zip(ids, bw)):
                a = (bw[i - 1][-1][2] + ws[0][1]) / 2 if i else 0.0   # knip in de stilte tussen zinnen
                z = (ws[-1][2] + bw[i + 1][0][1]) / 2 if i + 1 < len(bw) else bdur
                filt += f"[1]atrim={a:.3f}:{z:.3f},asetpts=PTS-STARTPTS,apad=pad_dur={PAUZE_ZIN if i + 1 < len(bw) else 0.0}[z{i}];"
                segs.append(f"[z{i}]")
                shift = t_out - a
                sc.append({"id": sid, "start": round(ws[0][1] + shift, 3), "end": round(ws[-1][2] + shift, 3),
                           "words": [{"t": w[0], "s": round(w[1] + shift, 3), "e": round(w[2] + shift, 3)} for w in ws]})
                t_out += (z - a) + (PAUZE_ZIN if i + 1 < len(bw) else 0.0)
            filt += "".join(segs) + f"concat=n={len(segs)}:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=9[o]"
            wav = ROOT / f"public/vo/b{bn}h{h}.wav"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(hmp3), "-i", str(bmp3), "-filter_complex", filt, "-map", "[o]", "-ar", "48000", "-ac", "1", str(wav)], check=True)
            timing[f"b{bn}h{h}"] = {"scenes": sc, "end": sc[-1]["end"], "audio": round(dur(wav), 3), "knop": d["knop"]}
            print(f"b{bn}h{h}: {dur(wav):.1f}s")
    (ROOT / "src/timing.json").write_text(json.dumps(timing, ensure_ascii=False, indent=1))

if __name__ == "__main__":
    main()

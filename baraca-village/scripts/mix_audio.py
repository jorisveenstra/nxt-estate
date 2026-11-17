"""
Mixt per variant (body + hook) de audio: eleven_v4-voice-over (hook, pauze, body), ElevenLabs-muziek
zacht eronder met ducking en korte fades, en subtiele ElevenLabs-geluidseffecten volgens src/plan.json.
Uitvoer: public/mix/<b>_h<h>.wav (48 kHz stereo, -14 LUFS, geen clipping).

Revisie (feedback "muziek en geluidseffecten veel te hard"): niveaus worden niet meer met vaste
volumefactoren gezet, maar op gemeten luidheid (EBU R128) van elke stem ten opzichte van de voice-over:
muziek MUZIEK_REL dB onder de stem (plus ducking tijdens spraak), ambient-effecten AMBIENT_REL dB en
korte accenten ACCENT_REL dB eronder. Zo kan geen enkel bed boven de stem uitkomen.

Gebruik: python3 scripts/mix_audio.py [b1_h1 ...]
"""
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLAN = json.loads((ROOT / "src/plan.json").read_text())
FPS = PLAN["fps"]
MUZIEK_REL = -15.0   # muziekbed t.o.v. voice-over (LUFS-verschil), vóór ducking
AMBIENT_REL = -24.0  # golven/tropisch/water t.o.v. voice-over
ACCENT_REL = -20.0   # korte pop/whoosh t.o.v. voice-over (gemeten over het korte geluid zelf)
VO_REF = None        # luidheid van de voice-over (gemeten)
_LUFS = {}


def lufs(p):
    """Geïntegreerde luidheid (LUFS) van een bestand, gecachet."""
    p = str(p)
    if p not in _LUFS:
        r = subprocess.run(["ffmpeg", "-nostdin", "-i", p, "-af", "ebur128", "-f", "null", "-"],
                           capture_output=True, text=True, check=True)
        regels = [l for l in r.stderr.splitlines() if l.strip().startswith("I:")]
        _LUFS[p] = float(regels[-1].split()[1])
    return _LUFS[p]


def gain(p, rel):
    """dB-versterking die bestand p op (voice-over + rel) LUFS zet."""
    return VO_REF + rel - lufs(p)


def mix(key):
    b, _ = key.split("_h")
    hook, body = PLAN["hooks"][key], PLAN["bodies"][b]
    t_body = hook["frames"] / FPS
    totaal = (hook["frames"] + body["frames"]) / FPS
    inputs = [ROOT / f"public/vo/{key}.mp3", ROOT / f"public/vo/{b}_body.mp3", ROOT / f"public/muziek/{b}.mp3"]
    f = [
        "[0]aresample=48000,aformat=channel_layouts=stereo[vh]",
        f"[1]aresample=48000,aformat=channel_layouts=stereo,adelay={int(t_body * 1000)}:all=1[vb]",
        "[vh][vb]amix=inputs=2:normalize=0,asplit=2[vo][sc]",
        f"[2]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{totaal:.3f},volume={gain(inputs[2], MUZIEK_REL):.2f}dB,"
        f"afade=t=in:d=0.4,afade=t=out:st={totaal - 1.6:.3f}:d=1.6[m]",
        "[m][sc]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=400[md]",
    ]
    sfx = [dict(s, at=s["at"]) for s in hook["sfx"]] + [dict(s, at=s["at"] + t_body) for s in body["sfx"]]
    labels = []
    for i, s in enumerate(sfx):
        inputs.append(ROOT / f"public/sfx/{s['file']}.mp3")
        n = len(inputs) - 1
        chain = f"[{n}]aresample=48000,aformat=channel_layouts=stereo"
        if s.get("dur"):
            d = max(0.6, s["dur"])
            chain += f",aloop=loop=-1:size=2e6,atrim=0:{d:.3f},afade=t=in:d=0.3,afade=t=out:st={d - 0.4:.3f}:d=0.4"
        rel = AMBIENT_REL if s.get("dur") else ACCENT_REL
        chain += f",volume={gain(inputs[-1], rel):.2f}dB,adelay={int(s['at'] * 1000)}:all=1[s{i}]"
        f.append(chain)
        labels.append(f"[s{i}]")
    f.append(f"[vo][md]{''.join(labels)}amix=inputs={2 + len(labels)}:normalize=0,"
             f"apad=whole_dur={totaal:.3f},atrim=0:{totaal:.3f},loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.89,aresample=48000[out]")
    uit = ROOT / f"public/mix/{key}.wav"
    cmd = ["ffmpeg", "-nostdin", "-v", "error", "-y"]
    for p in inputs:
        cmd += ["-i", str(p)]
    cmd += ["-filter_complex", ";".join(f), "-map", "[out]", "-ac", "2", "-ar", "48000", str(uit)]
    subprocess.run(cmd, check=True)
    return key


def main():
    global VO_REF
    # referentie: gemiddelde luidheid van de body-voice-overs (alle eleven_v4)
    vo = sorted((ROOT / "public/vo").glob("b*_body.mp3"))
    VO_REF = sum(lufs(p) for p in vo) / len(vo)
    for p in sorted((ROOT / "public/muziek").glob("*.mp3")) + sorted((ROOT / "public/sfx").glob("*.mp3")):
        lufs(p)
    (ROOT / "public/mix").mkdir(parents=True, exist_ok=True)
    keys = sys.argv[1:] or list(PLAN["hooks"])
    with ThreadPoolExecutor(2) as pool:
        for k in pool.map(mix, keys):
            print("mix", k, flush=True)


if __name__ == "__main__":
    main()

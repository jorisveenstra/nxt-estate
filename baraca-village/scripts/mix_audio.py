"""
Mixt per variant (body + hook) de audio: eleven_v4-voice-over (hook, pauze, body), ElevenLabs-muziek
zacht eronder met ducking en korte fades, en subtiele ElevenLabs-geluidseffecten volgens src/plan.json.
Uitvoer: public/mix/<b>_h<h>.wav (48 kHz stereo, -14 LUFS, geen clipping).

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
MUZIEK_VOL = 0.30


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
        f"[2]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{totaal:.3f},volume={MUZIEK_VOL},"
        f"afade=t=in:d=0.4,afade=t=out:st={totaal - 1.6:.3f}:d=1.6[m]",
        "[m][sc]sidechaincompress=threshold=0.04:ratio=5:attack=25:release=350[md]",
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
        chain += f",volume={s['vol']},adelay={int(s['at'] * 1000)}:all=1[s{i}]"
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
    (ROOT / "public/mix").mkdir(parents=True, exist_ok=True)
    keys = sys.argv[1:] or list(PLAN["hooks"])
    with ThreadPoolExecutor(2) as pool:
        for k in pool.map(mix, keys):
            print("mix", k, flush=True)


if __name__ == "__main__":
    main()

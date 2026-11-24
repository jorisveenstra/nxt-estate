"""
Bouwt per video de audio: hook-VO op 0, body-VO op het begin van het body-segment (frame-exact),
plus het ElevenLabs-muziekbed eronder (ingekort, fade-in/out, ducking onder de stem).

- public/vo/<b>h<n>.wav     alleen voice-over (preview in Remotion Studio)
- out/audio/<b>h<n>.wav     eindmix (voice-over + muziek) voor de definitieve MP4
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    t = json.loads((ROOT / "src/timing.json").read_text())
    tts = json.loads((ROOT / "scripts/woorden-tts.json").read_text())
    fps = t["fps"]
    (ROOT / "out/audio").mkdir(parents=True, exist_ok=True)
    (ROOT / "public/vo").mkdir(parents=True, exist_ok=True)
    for key, h in t["hooks"].items():
        b = key.split("h")[0]
        start = h["frames"] / fps
        totaal = (h["frames"] + t["bodies"][b]["frames"]) / fps
        ms = int(round(start * 1000))
        hook_mp3 = ROOT / tts[key]["mp3"]
        body_mp3 = ROOT / tts[f"{b}body"]["mp3"]
        vo = (f"[0]aresample=48000,aformat=channel_layouts=stereo[h];"
              f"[1]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms}[b];"
              f"[h][b]amix=inputs=2:normalize=0,apad,atrim=0:{totaal:.3f}")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(hook_mp3), "-i", str(body_mp3),
                        "-filter_complex", vo + ",loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000",
                        str(ROOT / f"public/vo/{key}.wav")], check=True)
        mix = (vo + ",asplit=2[vo][sc];"
               f"[2]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{totaal:.3f},volume=0.18,"
               f"afade=t=in:d=0.4,afade=t=out:st={totaal - 2.0:.3f}:d=2.0[m];"
               "[m][sc]sidechaincompress=threshold=0.02:ratio=5:attack=30:release=450[md];"
               "[vo][md]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,"
               f"atrim=0:{totaal:.3f}")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(hook_mp3), "-i", str(body_mp3),
                        "-i", str(ROOT / "public/muziek/muziek.mp3"), "-filter_complex", mix, "-ar", "48000",
                        str(ROOT / f"out/audio/{key}.wav")], check=True)
        print(key, f"{totaal:.2f}s")


if __name__ == "__main__":
    main()

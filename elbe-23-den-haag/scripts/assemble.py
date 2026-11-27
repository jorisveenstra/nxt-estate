"""Hook + body samenvoegen (stream copy) en audio mixen; controleert het resultaat met ffprobe."""
import json, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
T = json.loads((ROOT / "src/timing.json").read_text())
FPS = 30
TAIL = 1.4


def probe(p):
    return json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(p)],
                                     capture_output=True, text=True, check=True).stdout)


def main():
    seg = ROOT / "out/seg"
    for k in [k for k in T if "h" in k]:
        b, h = k.split("h")
        hf = round((T[k]["hookDur"] + T[k]["pause"]) * FPS)
        bf = -(-int((T[b]["bodyDur"] + TAIL) * FPS * 1000) // 1000)
        total = (hf + bf) / FPS
        lst = seg / f"{k}.txt"
        lst.write_text(f"file 'hook-{k}.mp4'\nfile 'body-{b}.mp4'\n")
        vid = seg / f"{k}-video.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(vid)], check=True)
        nb = int(probe(vid)["streams"][0].get("nb_frames", 0))
        if nb != hf + bf:  # stream copy mislukt -> opnieuw encoderen
            print(f"{k}: concat gaf {nb} frames i.p.v. {hf + bf}; her-encoderen")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c:v", "libx264",
                            "-crf", "24", "-pix_fmt", "yuv420p", str(vid)], check=True)
        delay = int(hf / FPS * 1000)
        out = ROOT / f"out/Elbe 23 - Body {b[1:]} Hook {h}.mp4"
        fc = (f"[1:a]aformat=sample_rates=48000:channel_layouts=stereo[hv];"
              f"[2:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay={delay}|{delay}[bv];"
              f"[hv][bv]amix=inputs=2:normalize=0,apad[vo];[vo]asplit=2[vo1][vo2];"
              f"[3:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.30,afade=t=in:d=0.4,"
              f"afade=t=out:st={total - 1.6:.2f}:d=1.6[m];"
              f"[m][vo1]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=450[md];"
              f"[vo2][md]amix=inputs=2:normalize=0,alimiter=limit=0.93,atrim=0:{total:.3f}[a]")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(vid), "-i", str(ROOT / f"public/vo/{k}.wav"),
                        "-i", str(ROOT / f"public/vo/{b}-body.wav"), "-i", str(ROOT / f"public/muziek/{b}-bed.mp3"),
                        "-filter_complex", fc, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                        "-t", f"{total:.3f}", "-movflags", "+faststart", str(out)], check=True)
        p = probe(out)
        v = next(s for s in p["streams"] if s["codec_type"] == "video")
        assert (v["width"], v["height"]) == (1080, 1920) and v.get("sample_aspect_ratio", "1:1") in ("1:1", "N/A"), v
        print(f"{out.name}: {v['width']}x{v['height']} {float(p['format']['duration']):.2f}s "
              f"{int(p['format']['size']) / 1e6:.1f} MB")


if __name__ == "__main__":
    main()

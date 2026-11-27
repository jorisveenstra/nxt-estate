"""
Rendert alle advertenties efficiënt:
1. Remotion rendert stil (zonder audio) elk bodydeel één keer (Body1..3) en elk hookdeel apart (Hook-B<b>-H<h>).
2. Per video: hookdeel + bodydeel samengevoegd met ffmpeg -c copy (harde knip, zelfde codec/instellingen).
3. Audio: voice-over (hook, dan body precies op de knip) + ElevenLabs-muziekbed eronder met ducking,
   korte fades, loudnorm; gemuxt met de video (stream copy) en faststart.

Gebruik: python3 scripts/render_alles.py [--browser /pad/naar/chrome-headless-shell] [--alleen b1h1,b2h3]
Uitvoer: out/delen/*.mp4 en out/De Twee Gezusters - Body X Hook Y.mp4
"""
import argparse
import concurrent.futures as cf
import json
import math
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
FPS = 30
HOOK_PAUSE, BODY_TAIL = 0.3, 2.0  # gelijk aan src/brand.ts
MUZIEK_DB = -17  # muziekniveau onder de stem (vóór ducking)


def frames(key, hook):
    t = json.loads((ROOT / "src/timing.json").read_text())[key]
    return math.ceil((t["audio"] + (HOOK_PAUSE if hook else BODY_TAIL)) * FPS)


def render(comp, uit, browser):
    if uit.exists():
        return
    tmp = uit.with_suffix(".tmp.mp4")
    cmd = ["npx", "remotion", "render", "src/index.ts", comp, str(tmp), "--muted", "--concurrency=2", "--crf=24",
           "--log=error", "--x264-preset=medium"]
    if browser:
        cmd.append(f"--browser-executable={browser}")
    subprocess.run(cmd, cwd=ROOT, check=True)
    tmp.rename(uit)
    print("gerenderd", comp, flush=True)


def probe(pad):
    j = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate,sample_aspect_ratio:stream_side_data=rotation:format=duration",
                                   "-of", "json", str(pad)], capture_output=True, text=True, check=True).stdout)
    return j


def assembleer(b, h):
    delen = OUT / "delen"
    hook, body = delen / f"hook-b{b}-h{h}.mp4", delen / f"body-b{b}.mp4"
    fh, fb = frames(f"b{b}-h{h}", True), frames(f"b{b}-body", False)
    th, tb = fh / FPS, fb / FPS
    totaal = th + tb
    lijst = delen / f"lijst-b{b}-h{h}.txt"
    lijst.write_text(f"file '{hook.name}'\nfile '{body.name}'\n")
    video = delen / f"video-b{b}-h{h}.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lijst), "-c", "copy", str(video)], check=True)
    vd = float(probe(video)["format"]["duration"])
    if abs(vd - totaal) > 0.1:  # stream-copy mislukt: opnieuw coderen
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(hook), "-i", str(body), "-filter_complex", "[0:v][1:v]concat=n=2:v=1:a=0",
                        "-c:v", "libx264", "-crf", "24", "-pix_fmt", "yuv420p", str(video)], check=True)
    uit = OUT / f"De Twee Gezusters - Body {b} Hook {h}.mp4"
    fade = max(0.0, totaal - 1.8)
    flt = (
        f"[0:a]aresample=48000,apad,atrim=0:{th:.4f}[h];"
        f"[1:a]aresample=48000,apad,atrim=0:{tb:.4f}[bd];"
        f"[h][bd]concat=n=2:v=0:a=1,asplit=2[vo][sc];"
        f"[2:a]aresample=48000,atrim=0:{totaal:.4f},volume={MUZIEK_DB}dB,afade=t=in:d=0.4,afade=t=out:st={fade:.3f}:d=1.8[m];"
        f"[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[md];"
        f"[vo][md]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]"
    )
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(ROOT / f"public/vo/b{b}-h{h}.wav"), "-i", str(ROOT / f"public/vo/b{b}-body.wav"),
                    "-i", str(ROOT / "public/muziek/muziek.mp3"), "-i", str(video), "-filter_complex", flt,
                    "-map", "3:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{totaal:.4f}",
                    "-movflags", "+faststart", str(uit)], check=True)
    j = probe(uit)
    v = next(s for s in j["streams"] if s["codec_type"] == "video")
    assert (v["width"], v["height"]) == (1080, 1920), uit
    assert v.get("sample_aspect_ratio", "1:1") in ("1:1", "N/A"), uit
    assert not any(float(sd.get("rotation", 0)) for sd in v.get("side_data_list", [])), uit
    print(f"klaar {uit.name}: {float(j['format']['duration']):.2f}s", flush=True)
    return uit


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--browser")
    ap.add_argument("--alleen")
    a = ap.parse_args()
    paren = [(b, h) for b in (1, 2, 3) for h in (1, 2, 3, 4, 5)]
    if a.alleen:
        paren = [p for p in paren if f"b{p[0]}h{p[1]}" in a.alleen.split(",")]
    (OUT / "delen").mkdir(parents=True, exist_ok=True)
    taken = [(f"Body{b}", OUT / f"delen/body-b{b}.mp4") for b in sorted({b for b, _ in paren})]
    taken += [(f"Hook-B{b}-H{h}", OUT / f"delen/hook-b{b}-h{h}.mp4") for b, h in paren]
    with cf.ThreadPoolExecutor(2) as ex:  # 4 kernen: twee renders tegelijk, elk met concurrency 2
        list(ex.map(lambda t: render(t[0], t[1], a.browser), taken))
    for b, h in paren:
        assembleer(b, h)


if __name__ == "__main__":
    main()
